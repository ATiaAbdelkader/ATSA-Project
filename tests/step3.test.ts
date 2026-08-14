import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calculateKinematics, generateSummary, buildAiEstimatedSummary } from '../src/services/casaService';
import handler, { storageUrlBelongsToUser } from '../api/gemini';

type MockRequest = {
  method?: string;
  headers: Record<string, string | undefined>;
  [Symbol.asyncIterator](): AsyncIterator<Buffer>;
};

type MockResponse = {
  statusCode?: number;
  headers: Record<string, string>;
  body: string;
  setHeader(name: string, value: string): void;
  end(value?: string): void;
};

function request(method: string, headers: Record<string, string | undefined> = {}): MockRequest {
  return {
    method,
    headers,
    async *[Symbol.asyncIterator]() {
      // No request body is needed for the rejection-path tests.
    }
  };
}

function response(): MockResponse {
  return {
    headers: {},
    body: '',
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(value = '') {
      this.body += value;
    }
  };
}

const settings = {
  fps: 30,
  micronsPerPixel: 0.5,
  profile: {
    name: 'Test profile',
    minConcentration: 15,
    minTotalMotility: 40,
    minProgressiveMotility: 20,
    minNormalMorphology: 30,
    minVitality: 60,
    maxLeukocytes: 1
  }
};

async function run() {
  const path = [
    { x: 0, y: 0, t: 0 },
    { x: 4, y: 2, t: 1 / 30 },
    { x: 8, y: 4, t: 2 / 30 },
    { x: 12, y: 6, t: 3 / 30 }
  ];

  const first = calculateKinematics(path, settings.fps, settings.micronsPerPixel);
  const second = calculateKinematics(path, settings.fps, settings.micronsPerPixel);
  assert.deepEqual(first, second, 'kinematics should be deterministic for the same path');
  assert.equal(first.bcf, 0, 'BCF must be unavailable until a validated measurement exists');
  assert.equal(first.mad, 0, 'MAD must be unavailable until a validated measurement exists');
  assert.equal(first.morphometry.area, 0, 'morphometry must not be fabricated');
  assert.equal(first.sdf.dfi, 0, 'SDF must not be fabricated');

  const emptySummary = generateSummary([], settings);
  assert.equal(emptySummary.provenance?.overall, 'visualization-only');
  assert.equal(emptySummary.leukocytes, 0);
  assert.equal(emptySummary.concentration, 0);
  assert.equal(emptySummary.morphology.normal, 0);
  assert.equal(emptySummary.vitality.total, 0);
  assert.equal(emptySummary.sdf.dfi, 0);
  assert.equal(emptySummary.interpretation?.status, 'not-validated');
  assert.equal(Number.isFinite(emptySummary.motility.total), true);

  const aiSummary = buildAiEstimatedSummary({
    concentration: '42 M/ml',
    motility: { progressive: '35%', nonProgressive: '20%', immotile: '45%' },
    morphology: { normal: '70%' },
    observations: 'Research estimate only.'
  }, settings);
  assert.equal(aiSummary.provenance?.overall, 'ai-estimated');
  assert.equal(aiSummary.concentration, 42);
  assert.equal(aiSummary.motility.progressive, 35);
  assert.equal(aiSummary.motility.total, 55);
  assert.equal(aiSummary.kinematics.avgVcl, 0);
  assert.equal(aiSummary.vitality.total, 0);
  assert.equal(aiSummary.sdf.dfi, 0);

  const optionsRes = response();
  await handler(request('OPTIONS') as any, optionsRes as any);
  assert.equal(optionsRes.statusCode, 204, 'OPTIONS should be handled without authentication');

  const methodRes = response();
  await handler(request('GET') as any, methodRes as any);
  assert.equal(methodRes.statusCode, 405, 'non-POST requests must be rejected');

  const authRes = response();
  await handler(request('POST') as any, authRes as any);
  assert.equal(authRes.statusCode, 401, 'requests without a Firebase ID token must be rejected');
  assert.match(authRes.body, /Authentication is required/);

  const ownedMediaUrl = 'https://firebasestorage.googleapis.com/v0/b/ai-studio-applet-webapp-5a3d7.firebasestorage.app/o/videos%2Fuser-123%2Fsample-abc%2Fvideo.mp4?alt=media&token=test-token';
  assert.equal(storageUrlBelongsToUser(ownedMediaUrl, 'user-123'), true, 'a user-owned Storage URL should be accepted');
  assert.equal(storageUrlBelongsToUser(ownedMediaUrl, 'user-456'), false, 'a different user must not use another user\'s Storage URL');
  assert.equal(storageUrlBelongsToUser('https://firebasestorage.googleapis.com/v0/b/ai-studio-applet-webapp-5a3d7.firebasestorage.app/o/videos%2Fvideo.mp4?alt=media&token=test-token', 'user-123'), false, 'legacy flat Storage paths must be rejected');
  assert.equal(storageUrlBelongsToUser(ownedMediaUrl.replace('&token=test-token', ''), 'user-123'), false, 'untokenized Storage URLs must be rejected');

  const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
  assert.match(rules, /isAuthenticated\(\)/, 'Firestore rules must require authentication');
  assert.match(rules, /data\.uid == request\.auth\.uid/, 'Firestore rules must enforce ownership');
  assert.doesNotMatch(rules, /guestUser|guest-session|jury/, 'legacy shared guest authorization must stay removed');
  const storageRules = readFileSync(new URL('../storage.rules', import.meta.url), 'utf8');
  assert.match(storageRules, /request\.auth\.uid == userId/, 'Storage Rules must enforce UID ownership');
  assert.match(storageRules, /videos\/\{userId\}\/\{sampleId\}/, 'Storage Rules must require the UID-scoped path');
  assert.match(storageRules, /request\.resource\.size <= 15 \* 1024 \* 1024/, 'Storage Rules must cap uploaded media size');
  assert.match(storageRules, /\^\(image\|video\)\//, 'Storage Rules must restrict uploads to media content types');

  const viteConfig = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(viteConfig, /GEMINI_API_KEY/, 'the Vite config must not inject the Gemini key');
  const clientSource = readFileSync(new URL('../src/services/geminiService.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(clientSource, /GoogleGenAI|GEMINI_API_KEY/, 'the browser helper must not import Gemini or access its key');

  console.log('Step 3 regression tests passed.');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
