import { getApp, getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { GoogleGenAI, Type } from '@google/genai';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { enforceGeminiLimits, GEMINI_LIMITS, getRateLimitErrorHeaders } from './rateLimit';

type GeminiMode = 'media-analysis' | 'interpretation' | 'history-summary' | 'chat';

type GeminiRequest = {
  mode?: GeminiMode;
  fileUrl?: string;
  mimeType?: string;
  isVideo?: boolean;
  prompt?: string;
  message?: string;
  summary?: unknown;
};

const MAX_JSON_BYTES = GEMINI_LIMITS.maxRequestBytes;
const MAX_MEDIA_BYTES = GEMINI_LIMITS.maxMediaBytes;
const STORAGE_BUCKET = 'ai-studio-applet-webapp-5a3d7.firebasestorage.app';

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

async function readBody(req: IncomingMessage): Promise<GeminiRequest> {
  const providedBody = (req as IncomingMessage & { body?: unknown }).body;
  if (providedBody && typeof providedBody === 'object') {
    if (JSON.stringify(providedBody).length > MAX_JSON_BYTES) {
      throw new Error('Request body is too large.');
    }
    return providedBody as GeminiRequest;
  }

  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_JSON_BYTES) {
      throw new Error('Request body is too large.');
    }
    chunks.push(buffer);
  }

  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString('utf8');
  return JSON.parse(raw) as GeminiRequest;
}

function getAdminAuth() {
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    throw new Error('Firebase Admin credentials are not configured.');
  }

  const app = getApps().length > 0
    ? getApp()
    : initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
      });

  return getAuth(app);
}

async function requireAuthenticatedUser(req: IncomingMessage) {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    throw Object.assign(new Error('Authentication is required.'), { statusCode: 401 });
  }

  const token = authorization.slice('Bearer '.length).trim();
  if (!token) {
    throw Object.assign(new Error('Authentication is required.'), { statusCode: 401 });
  }

  try {
    return await getAdminAuth().verifyIdToken(token);
  } catch {
    throw Object.assign(new Error('The authentication token is invalid or expired.'), { statusCode: 401 });
  }
}

function requireMode(body: GeminiRequest): GeminiMode {
  const allowedModes: GeminiMode[] = ['media-analysis', 'interpretation', 'history-summary', 'chat'];
  if (!body.mode || !allowedModes.includes(body.mode)) {
    throw Object.assign(new Error('Unsupported Gemini operation.'), { statusCode: 400 });
  }
  return body.mode;
}

function requireText(value: unknown, field: string, maxLength: number) {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > maxLength) {
    throw Object.assign(new Error(`Invalid ${field}.`), { statusCode: 400 });
  }
  return value.trim();
}

function mediaAnalysisSchema() {
  return {
    type: Type.OBJECT,
    properties: {
      concentration: { type: Type.STRING, description: 'Estimated concentration in M/ml' },
      motility: {
        type: Type.OBJECT,
        properties: {
          progressive: { type: Type.STRING },
          nonProgressive: { type: Type.STRING },
          immotile: { type: Type.STRING }
        }
      },
      morphology: {
        type: Type.OBJECT,
        properties: {
          normal: { type: Type.STRING },
          defects: {
            type: Type.OBJECT,
            properties: {
              head: { type: Type.ARRAY, items: { type: Type.STRING } },
              midpiece: { type: Type.ARRAY, items: { type: Type.STRING } },
              tail: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      },
      observations: { type: Type.STRING, description: 'A summary observation text' }
    },
    required: ['concentration', 'morphology', 'observations']
  };
}

function interpretationSchema() {
  return {
    type: Type.OBJECT,
    properties: {
      status: { type: Type.STRING, description: 'Must be normal, borderline, or abnormal' },
      comments: { type: Type.ARRAY, items: { type: Type.STRING } },
      recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ['status', 'comments', 'recommendations']
  };
}

export function storageUrlBelongsToUser(fileUrl: string, uid: string) {
  try {
    const url = new URL(fileUrl);
    const prefix = `/v0/b/${STORAGE_BUCKET}/o/`;
    if (url.protocol !== 'https:' ||
      url.hostname !== 'firebasestorage.googleapis.com' ||
      !url.pathname.startsWith(prefix) ||
      !url.searchParams.has('token')) {
      return false;
    }

    const objectPath = decodeURIComponent(url.pathname.slice(prefix.length));
    return objectPath.startsWith(`videos/${uid}/`);
  } catch {
    return false;
  }
}

async function loadMedia(fileUrl: string, mimeType: string, uid: string) {
  if (!storageUrlBelongsToUser(fileUrl, uid)) {
    throw Object.assign(new Error('Media URL is not a valid user-owned ATSA Storage URL.'), { statusCode: 403 });
  }

  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw Object.assign(new Error('Unable to fetch the uploaded media.'), { statusCode: 502 });
  }

  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > MAX_MEDIA_BYTES) {
    throw Object.assign(new Error('Media file is too large for server-side analysis.'), { statusCode: 413 });
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > MAX_MEDIA_BYTES) {
    throw Object.assign(new Error('Media file is too large for server-side analysis.'), { statusCode: 413 });
  }

  return { mimeType, data: buffer.toString('base64') };
}

async function generateGeminiResponse(body: GeminiRequest, uid: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw Object.assign(new Error('Gemini server configuration is incomplete.'), { statusCode: 503 });

  const ai = new GoogleGenAI({ apiKey });

  if (body.mode === 'media-analysis') {
    const fileUrl = requireText(body.fileUrl, 'fileUrl', 2_000);
    const mimeType = requireText(body.mimeType, 'mimeType', 100);
    if (body.isVideo !== undefined && typeof body.isVideo !== 'boolean') {
      throw Object.assign(new Error('Invalid isVideo flag.'), { statusCode: 400 });
    }
    if (!/^(video|image)\/[a-z0-9.+-]+$/i.test(mimeType)) {
      throw Object.assign(new Error('Unsupported media type.'), { statusCode: 400 });
    }

    const media = await loadMedia(fileUrl, mimeType, uid);
    const prompt = body.isVideo
      ? `Analyze this microscopy video of sperm. Provide a detailed assessment in JSON format with concentration, motility percentages (progressive, nonProgressive, immotile), morphology normal percentage and head/midpiece/tail defects, and overall observations. This is a research prototype; clearly state uncertainty and do not present the output as a validated clinical diagnosis.`
      : `Analyze this microscopy image of sperm. Provide a detailed assessment in JSON format with concentration, morphology normal percentage and head/midpiece/tail defects, and overall observations. This is a research prototype; clearly state uncertainty and do not present the output as a validated clinical diagnosis.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [{ parts: [{ text: prompt }, { inlineData: media }] }],
      config: { responseMimeType: 'application/json', responseSchema: mediaAnalysisSchema() }
    });
    return response.text || '';
  }

  if (body.mode === 'interpretation') {
    const prompt = requireText(body.prompt, 'prompt', 30_000);
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json', responseSchema: interpretationSchema() }
    });
    return response.text || '';
  }

  if (body.mode === 'history-summary') {
    const prompt = requireText(body.prompt, 'prompt', 30_000);
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }]
    });
    return response.text || '';
  }

  const message = requireText(body.message, 'message', GEMINI_LIMITS.maxChatMessageCharacters);
  const summary = JSON.stringify(body.summary ?? null);
  if (summary.length > GEMINI_LIMITS.maxSummaryCharacters) {
    throw Object.assign(new Error('Analysis summary is too large.'), { statusCode: 413 });
  }
  const chat = ai.chats.create({
    model: 'gemini-3.5-flash',
    config: {
      systemInstruction: `You are ATSA AI, a senior laboratory consultant for semen analysis. You have access to the current analysis results below. Answer questions concisely and professionally based on these results. If the question is outside the results, provide general laboratory guidance and remind the user that this research prototype is not a validated clinical diagnostic system.\n\nCurrent analysis results:\n${summary.slice(0, 40_000)}`
    }
  });
  const response = await chat.sendMessage({ message });
  return response.text || '';
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Allow', 'POST, OPTIONS');
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }

  try {
    const user = await requireAuthenticatedUser(req);
    const body = await readBody(req);
    const mode = requireMode(body);
    await enforceGeminiLimits(req, user.uid, mode);
    const text = await generateGeminiResponse(body, user.uid);
    sendJson(res, 200, { text });
  } catch (error) {
    const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error
      ? Number((error as { statusCode: number }).statusCode)
      : 500;
    const message = error instanceof SyntaxError
      ? 'Request body must be valid JSON.'
      : error instanceof Error
        ? error.message
        : 'Gemini request failed.';
    console.error('Gemini API error:', error);
    const retryHeaders = getRateLimitErrorHeaders(error);
    Object.entries(retryHeaders).forEach(([name, value]) => res.setHeader(name, value));
    sendJson(res, statusCode >= 400 && statusCode < 600 ? statusCode : 500, { error: message });
  }
}
