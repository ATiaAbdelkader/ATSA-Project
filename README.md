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

The Firebase web configuration in `firebase-applet-config.json` contains public browser bootstrap values and is separate from the Firebase Admin service-account credentials.

## Security requirements

All requests to `/api/gemini` must include a Firebase ID token in the `Authorization: Bearer <token>` header. The endpoint validates the token before using Gemini. Media analysis accepts only HTTPS Firebase Storage download URLs belonging to the configured ATSA bucket and limits the downloaded media size.

Do not place `GEMINI_API_KEY`, `FIREBASE_CLIENT_EMAIL`, or `FIREBASE_PRIVATE_KEY` in client-side source code, `VITE_*` variables, or committed files.

## Available scripts

```bash
npm run dev      # Start the Vite browser development server
npm run lint     # Run TypeScript type checking
npm run build    # Build the production frontend
npm run preview  # Preview the Vite production build
```
