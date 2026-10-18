# Editorial

Standalone Next.js application. Node 24 required.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Local address: http://localhost:3001/editorial.

Set the CMS and website URLs in `.env.local`; never commit credentials. Production variables must use the actual HTTPS hostnames. SITE_URL is the editorial origin (used for secure cookies and CSRF checks); PUBLIC_SITE_URL points to the public website.

```sh
npm run lint
npm run typecheck
npm run build
npm start
```

## Vercel

Push this folder to its own GitHub repository and import it in Vercel. Framework: Next.js. Root Directory: repository root. If using the combined repository, set Root Directory to `editorial`. Install: `npm ci`; Build: `npm run build`; Output: Next.js default. Copy the variable names from `.env.example` into Vercel Settings → Environment Variables, replace localhost with hosted addresses, then deploy. No CMS secrets or AI keys are needed here.

This project uses only its own bundled schema package under `vendor/shared-types`; sibling folders are not required.


## Saved progress and AI-provider management

See `DEPLOY-RESUMABLE-AI.md` for the coordinated CMS/editorial/worker upgrade. Super administrators can add multiple encrypted keys per provider at /editorial/settings. Long jobs save analysis and automatically resume after quota waits. The worker must be updated once before web-managed keys take effect.
