import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (relativePath) => readFileSync(join(root, relativePath), 'utf8');
const failures = [];

function requireText(relativePath, text) {
  if (!read(relativePath).includes(text)) failures.push(`${relativePath} is missing: ${text}`);
}

function walk(directory) {
  const absolute = join(root, directory);
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relative = join(directory, entry.name);
    if (entry.isDirectory()) return walk(relative);
    return [relative];
  });
}

const firebase = JSON.parse(read('firebase.json'));
const vercel = JSON.parse(read('vercel.json'));
if (firebase.firestore?.rules !== 'firestore.rules') failures.push('firebase.json must deploy firestore.rules.');
if (firebase.storage?.rules !== 'storage.rules') failures.push('firebase.json must deploy storage.rules.');
if (!vercel.functions?.['api/gemini.ts']) failures.push('vercel.json must define api/gemini.ts.');

for (const variable of ['GEMINI_API_KEY', 'FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN']) {
  requireText('.env.example', variable);
}

const protectedClientReferences = /GEMINI_API_KEY|FIREBASE_PRIVATE_KEY|UPSTASH_REDIS_REST_TOKEN/;
for (const relativePath of [...walk('src'), 'vite.config.ts']) {
  if (/\.(tsx?|ts)$/.test(relativePath) && protectedClientReferences.test(read(relativePath))) {
    failures.push(`Protected server variable referenced by browser source: ${relativePath}`);
  }
}

requireText('api/gemini.ts', 'enforceGeminiLimits');
requireText('api/gemini.ts', 'storageUrlBelongsToUser');
requireText('api/rateLimit.ts', 'rate_limit_store_not_configured');
requireText('storage.rules', 'videos/{userId}/{sampleId}/{fileName}');

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log('Deployment configuration checks passed.');
