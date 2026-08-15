import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const firebaseSource = readFileSync(new URL('../src/firebase.ts', import.meta.url), 'utf8');
const translationsSource = readFileSync(new URL('../src/lib/i18n.ts', import.meta.url), 'utf8');
const rulesSource = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');

assert.match(appSource, /createUserWithEmailAndPassword\(auth, normalizedEmail, password\)/, 'account creation must use Firebase email/password auth');
assert.match(appSource, /signInWithEmailAndPassword\(auth, normalizedEmail, password\)/, 'login must use Firebase email/password auth');
assert.match(appSource, /sendPasswordResetEmail\(auth, normalizedEmail\)/, 'password reset must use Firebase email/password auth');
assert.match(appSource, /signInAnonymously\(auth\)/, 'temporary guest access must use Firebase Anonymous Authentication');
assert.match(appSource, /currentUser\.isAnonymous/, 'the UI must distinguish anonymous sessions');
assert.match(appSource, /guestNotice/, 'temporary guest limitations must be visible');
assert.match(appSource, /role="alert"/, 'authentication errors must be visible in the UI');
assert.doesNotMatch(appSource, /jury_guest_pass|guest-session|guestUser|signInWithPopup|signInWithRedirect|getRedirectResult|googleProvider/, 'shared or Google-only authentication paths must remain removed');
assert.doesNotMatch(firebaseSource, /GoogleAuthProvider|googleProvider/, 'Firebase initialization must not depend on Google provider');
assert.match(translationsSource, /authErrorEmailProviderDisabled/, 'provider setup guidance must be localized');
assert.match(translationsSource, /guestButton/, 'temporary guest access must be localized');
assert.match(translationsSource, /guestNotice/, 'guest data limitations must be localized');
assert.match(rulesSource, /request\.auth\.uid == userId/, 'Firestore ownership must remain UID-scoped');
assert.doesNotMatch(rulesSource, /jury_guest_pass|guest-session/, 'Firestore rules must not contain a shared guest bypass');

console.log('Authentication regression tests passed.');
