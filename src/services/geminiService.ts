import { auth } from '../firebase';

export type GeminiRequest =
  | {
      mode: 'media-analysis';
      fileUrl: string;
      mimeType: string;
      isVideo: boolean;
    }
  | {
      mode: 'interpretation' | 'history-summary';
      prompt: string;
    }
  | {
      mode: 'chat';
      message: string;
      summary: unknown;
    };

export type GeminiResponse = { text: string };

export async function callGemini(request: GeminiRequest): Promise<GeminiResponse> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to use AI analysis.');
  }

  const idToken = await user.getIdToken();
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`
    },
    body: JSON.stringify(request)
  });

  const payload = await response.json().catch(() => ({} as { error?: string; text?: string }));
  if (!response.ok) {
    throw new Error(payload.error || `AI request failed with status ${response.status}.`);
  }

  if (typeof payload.text !== 'string') {
    throw new Error('AI response was malformed.');
  }

  return { text: payload.text };
}
