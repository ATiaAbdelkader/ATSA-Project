# ATSA Project

ATSA is a React/Vite prototype for computer-aided sperm analysis workflows, Firebase-authenticated data storage, and AI-assisted interpretation.

## Local development

**Prerequisites:** Node.js 20 or newer.

Install dependencies with:

```bash
npm install
```

The standard Vite command starts the browser interface:

```bash
npm run dev
```

The AI features are exposed through the Vercel serverless function at `/api/gemini`. The Vite development server does not execute Vercel functions by itself. To test the complete application locally, install the Vercel CLI and run the project through `vercel dev`, or deploy a preview to Vercel.

## Required Vercel environment variables

Configure the following variables in the Vercel project settings for Preview and Production environments:

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Server-only Gemini credential used by `api/gemini.ts`. Never expose it as a `VITE_` variable or define it in `vite.config.ts`. |
| `FIREBASE_PROJECT_ID` | Firebase project ID used by Firebase Admin token verification. |
| `FIREBASE_CLIENT_EMAIL` | Service-account client email used by Firebase Admin. |
| `FIREBASE_PRIVATE_KEY` | Service-account private key. Preserve newline escapes when entering it in Vercel. |
| `UPSTASH_REDIS_REST_URL` | Shared Redis REST endpoint used for cross-invocation Gemini rate limits and quotas. |
| `UPSTASH_REDIS_REST_TOKEN` | Server-only Redis REST token. Never expose it to the browser. |

The Firebase web configuration in `firebase-applet-config.json` contains public browser bootstrap values and is separate from the Firebase Admin service-account credentials.

## Authentication setup

The application uses Firebase Authentication with **Email/Password** as the normal login and account-creation path. In the Firebase Console for project `ai-studio-applet-webapp-5a3d7`, open **Authentication → Sign-in method** and enable **Email/Password**. Enable **Anonymous** while temporary guest access is needed. The application does not use a shared guest credential: every guest session receives a unique Firebase anonymous UID and can access only records created under that UID.

Temporary guest data is intentionally non-portable. It may be lost after sign-out, browser-data removal, or device changes. Users who need to retain work should create an email/password account. The login screen provides password reset by email and displays localized Firebase errors when a provider is disabled or credentials are invalid.

Google sign-in is not required for the normal flow and has been removed from the application UI. Therefore, the Vercel domain does not need to be authorized for Google OAuth. Firebase still requires the normal web application domain configuration for its own authentication endpoints; keep `atsa-project.vercel.app` and `localhost` in **Authentication → Settings → Authorized domains**.

## Security requirements

All requests to `/api/gemini` must include a Firebase ID token in the `Authorization: Bearer <token>` header. The endpoint validates the token before using Gemini. Media analysis accepts only HTTPS Firebase Storage download URLs belonging to the configured ATSA bucket, requires a tokenized URL under `videos/{uid}/...`, verifies that the path belongs to the authenticated UID, and limits the downloaded media size.

Firebase Storage access is defined in `storage.rules` and media uploads use the path `videos/{uid}/{sampleId}/{filename}`. After authenticating with the Firebase CLI, deploy both database and Storage rules with:

```bash
firebase deploy --only firestore:rules,storage
```

Do not use the old flat `videos/{timestamp}_{filename}` path for new uploads. Existing files under the legacy path are intentionally not accepted by the server-side media-analysis endpoint.

Do not place `GEMINI_API_KEY`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, or `UPSTASH_REDIS_REST_TOKEN` in client-side source code, `VITE_*` variables, or committed files.

The Gemini endpoint uses shared-store protection in production. Default limits are three media analyses per user per minute and 30 per user per day, with higher limits for interpretation, history summaries, and chat. The operation-specific values can be overridden with `ATSA_GEMINI_<MODE>_USER_PER_MINUTE`, `ATSA_GEMINI_<MODE>_IP_PER_MINUTE`, and `ATSA_GEMINI_<MODE>_DAILY_QUOTA`. If the Upstash variables are absent, local development continues without distributed limits; production deployments must configure both variables. A Redis outage fails closed with HTTP 503 rather than calling Gemini without protection.

## Available scripts

```bash
npm run dev      # Start the Vite browser development server
npm run lint     # Run TypeScript type checking
npm run build    # Build the production frontend
npm run preview  # Preview the Vite production build
```

## Validation workflow foundation

The repository now includes a deterministic validation service at `src/services/validationService.ts`. It compares authorized human reference labels and numeric measurements with AI outputs, producing exact categorical agreement, a confusion matrix, and numeric absolute-error metrics. These metrics describe agreement with the supplied reference annotations; they do not establish clinical validity or diagnostic performance.

The validation service is intentionally data-agnostic. A future research interface can supply consented, human-reviewed annotation pairs without introducing simulated datasets into the application.

## Local quality gates

Run `npm test` for the security, provenance, and validation regression suites. Run `npm run verify:deployment` to check Firebase/Vercel metadata and server-only environment boundaries, then run `npm run typecheck` and `npm run build` before deployment. The same checks run in `.github/workflows/ci.yml` for pushes and pull requests targeting `main`.
