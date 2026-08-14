import type { IncomingMessage } from 'node:http';

export type GeminiRateLimitMode = 'media-analysis' | 'interpretation' | 'history-summary' | 'chat';

type LimitRule = {
  userPerMinute: number;
  ipPerMinute: number;
  dailyQuota: number;
};

type RedisResult = { result?: number | string | null };

type RateLimitError = Error & {
  statusCode: number;
  retryAfterSeconds?: number;
  code?: string;
};

const RULES: Record<GeminiRateLimitMode, LimitRule> = {
  'media-analysis': { userPerMinute: 3, ipPerMinute: 8, dailyQuota: 30 },
  interpretation: { userPerMinute: 10, ipPerMinute: 20, dailyQuota: 100 },
  'history-summary': { userPerMinute: 10, ipPerMinute: 20, dailyQuota: 100 },
  chat: { userPerMinute: 20, ipPerMinute: 40, dailyQuota: 200 }
};

const WINDOW_SECONDS = 60;
const DAY_SECONDS = 86_400;

function numberFromEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

export function getGeminiLimitRule(mode: GeminiRateLimitMode): LimitRule {
  const rule = RULES[mode];
  return {
    userPerMinute: numberFromEnv(`ATSA_GEMINI_${mode.toUpperCase().replace(/-/g, '_')}_USER_PER_MINUTE`, rule.userPerMinute),
    ipPerMinute: numberFromEnv(`ATSA_GEMINI_${mode.toUpperCase().replace(/-/g, '_')}_IP_PER_MINUTE`, rule.ipPerMinute),
    dailyQuota: numberFromEnv(`ATSA_GEMINI_${mode.toUpperCase().replace(/-/g, '_')}_DAILY_QUOTA`, rule.dailyQuota)
  };
}

function getRedisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  return url && token ? { url, token } : null;
}

function createError(message: string, statusCode: number, extra: Partial<RateLimitError> = {}) {
  return Object.assign(new Error(message), { statusCode, ...extra }) as RateLimitError;
}

async function redisPipeline(commands: Array<Array<string | number>>) {
  const config = getRedisConfig();
  if (!config) return null;

  const response = await fetch(`${config.url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(commands)
  });

  if (!response.ok) {
    throw new Error(`Rate-limit store returned HTTP ${response.status}.`);
  }

  const result = await response.json() as RedisResult[];
  return result.map((entry) => Number(entry.result ?? 0));
}

function keyPart(value: string) {
  return encodeURIComponent(value).slice(0, 160);
}

type RequestWithHeaders = Pick<IncomingMessage, 'headers'>;

function getClientIp(req: RequestWithHeaders) {
  const forwarded = req.headers['x-forwarded-for'];
  const firstForwarded = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0];
  return (firstForwarded || req.headers['x-real-ip'] || 'unknown').toString().trim() || 'unknown';
}

function utcDayKey() {
  return new Date().toISOString().slice(0, 10);
}

function secondsUntilNextMinute() {
  return Math.max(1, 60 - Math.floor(Date.now() / 1000) % 60);
}

export function rateLimitConfigEnabled() {
  return Boolean(getRedisConfig());
}

export async function enforceGeminiLimits(req: RequestWithHeaders, uid: string, mode: GeminiRateLimitMode) {
  const config = getRedisConfig();
  if (!config) {
    if (process.env.NODE_ENV === 'production') {
      throw createError('Gemini protection is not configured.', 503, { code: 'rate_limit_store_not_configured' });
    }
    return;
  }

  const rule = getGeminiLimitRule(mode);
  const clientIp = getClientIp(req);
  const minuteBucket = Math.floor(Date.now() / 60_000);
  const day = utcDayKey();
  const userRateKey = `atsa:gemini:rate:user:${keyPart(uid)}:${mode}:${minuteBucket}`;
  const ipRateKey = `atsa:gemini:rate:ip:${keyPart(clientIp)}:${mode}:${minuteBucket}`;
  const dailyKey = `atsa:gemini:quota:${keyPart(uid)}:${mode}:${day}`;

  try {
    const results = await redisPipeline([
      ['INCR', userRateKey],
      ['EXPIRE', userRateKey, WINDOW_SECONDS],
      ['INCR', ipRateKey],
      ['EXPIRE', ipRateKey, WINDOW_SECONDS],
      ['INCR', dailyKey],
      ['EXPIRE', dailyKey, DAY_SECONDS + WINDOW_SECONDS]
    ]);

    if (!results) return;

    const userCount = results[0] ?? 0;
    const ipCount = results[2] ?? 0;
    const dailyCount = results[4] ?? 0;
    const retryAfter = secondsUntilNextMinute();

    if (userCount > rule.userPerMinute || ipCount > rule.ipPerMinute) {
      throw createError('Too many Gemini requests. Please retry later.', 429, {
        retryAfterSeconds: retryAfter,
        code: 'rate_limit_exceeded'
      });
    }

    if (dailyCount > rule.dailyQuota) {
      throw createError('The daily Gemini quota for this operation has been reached.', 429, {
        retryAfterSeconds: Math.max(1, DAY_SECONDS - (Math.floor(Date.now() / 1000) % DAY_SECONDS)),
        code: 'daily_quota_exceeded'
      });
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error;
    throw createError('The Gemini protection service is temporarily unavailable.', 503, {
      code: 'rate_limit_store_unavailable'
    });
  }
}

export function getRateLimitErrorHeaders(error: unknown) {
  if (!error || typeof error !== 'object' || !('retryAfterSeconds' in error)) return {};
  const retryAfter = Number((error as { retryAfterSeconds?: number }).retryAfterSeconds);
  return Number.isFinite(retryAfter) && retryAfter > 0 ? { 'Retry-After': String(Math.ceil(retryAfter)) } : {};
}

export const GEMINI_LIMITS = {
  maxRequestBytes: 1_000_000,
  maxMediaBytes: 15 * 1024 * 1024,
  maxPromptCharacters: 30_000,
  maxChatMessageCharacters: 4_000,
  maxSummaryCharacters: 40_000
} as const;
