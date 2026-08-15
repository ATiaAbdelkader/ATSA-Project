import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const firebaseSource = readFileSync(new URL('../src/firebase.ts', import.meta.url), 'utf8');
const translationsSource = readFileSync(new URL('../src/lib/i18n.ts', import.meta.url), 'utf8');

assert.match(appSource, /signInWithPopup\(auth, googleProvider\)/, 'Google popup sign-in must remain available');
assert.match(appSource, /signInWithRedirect\(auth, googleProvider\)/, 'blocked popups must have a redirect fallback');
assert.match(appSource, /getRedirectResult\(auth\)/, 'redirect results must be completed after returning from Google');
assert.match(appSource, /authErrorUnauthorizedDomain/, 'unauthorized-domain errors must be surfaced to users');
assert.match(appSource, /authErrorProviderDisabled/, 'disabled-provider errors must be surfaced to users');
assert.match(appSource, /role="alert"/, 'authentication errors must be visible in the UI');
assert.match(firebaseSource, /GoogleAuthProvider/, 'Firebase must use the Google provider');
assert.match(firebaseSource, /prompt: 'select_account'/, 'Google account selection must be explicit');
assert.match(translationsSource, /authErrorUnauthorizedDomain/, 'authentication errors must be localized');
assert.match(translationsSource, /authErrorProviderDisabled/, 'provider setup guidance must be localized');
assert.doesNotMatch(appSource, /jury_guest_pass|guest-session|guestUser/, 'shared guest identity must remain removed');

console.log('Authentication regression tests passed.');
