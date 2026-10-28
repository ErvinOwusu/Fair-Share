# FairShare frontend

Vue 3 / Vite. The original landing page is retained unchanged in `src/views/LandingView.vue`. Login, signup and household screens use the real Java API; there are no demo accounts or simulated data in the application.

## Run

Use a supported Node.js version from package.json, then from this folder:

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Set `VITE_API_BASE_URL` in your uncommitted `.env.local` to the backend address. For a local Java backend use `http://localhost:8080`. Start the backend separately with its environment variables; see the repository README. Vite defaults to http://localhost:5173. The backend must allow that exact origin through APP_ALLOWED_ORIGINS. If using another hostname/port, update that backend setting. Restart Vite after changing .env.local.

```powershell
npm test
npm run build
npm run preview
```

Build output: dist/. The scripts invoke Vite through Node directly to avoid Windows command-shim problems in folders containing an ampersand.

Production requires VITE_API_BASE_URL set at build time to a reachable HTTPS backend. Blank production configuration shows a setup message; it never enables a fake account flow. For a production-mode local build, set the address explicitly before building.

See [the integration guide](../docs/ACCOUNT-HOUSEHOLD-UI.md) for the complete file map, Vercel/Supabase connection, session behavior, manual checks and remaining limitations.
