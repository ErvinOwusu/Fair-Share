# Account and household UI: where everything is

## Branch and folders

This work is on `codex/account-household-ui`. It was developed in a separate Git worktree at:

`C:\Users\ervin\OneDrive\Documents\SCHOOL\SD&D\FairShare Development`

The original checkout at `C:\Users\ervin\OneDrive\Documents\CS\FairShare\Fair-Share` remains on main. Creating/editing/committing this branch does not change main. A push publishes the branch for review; it may trigger a Vercel preview if configured. Merging into main is a separate action, not performed for this change.

The older `FairShare Local Preview` folder is still a standalone simulated prototype. It is not the code being proposed to the team. Never copy its `demoStore.js` into this real integration.

## What changed

| File | What to look for |
|---|---|
| `fairshare/src/App.vue` | Chooses the screen from the URL hash, restores sign-in, loads households and coordinates form actions. |
| `fairshare/src/views/LandingView.vue` | Original App.vue moved here without changing its template or styles. The photo, fonts, colors and layout are retained. Existing #login/#signup links now lead to forms because App.vue handles those hashes. |
| `fairshare/src/views/AuthView.vue` | Email/password login and signup forms; matching-password check, pending state, errors and check-your-email message. No group-member shortcuts. |
| `fairshare/src/views/HouseholdsView.vue` | Household cards, create dialog and details. Uses the backend's ownerUserId/memberUserIds fields. |
| `fairshare/src/services/api.js` | The only new file that sends requests. Handles API address, Authorization headers, session renewal, response errors and logout. |
| `fairshare/src/assets/account.css` | Styling restricted to .account-ui, so the homepage's existing styling is unaffected. |
| `fairshare/.env.example` | Documents the public backend address. Copy to ignored .env.local for your own settings. |
| `fairshare/.gitignore` | Excludes real environment files while retaining the safe example. |
| `fairshare/package.json` | Adds npm test and invokes Vite directly through Node to work in Windows paths containing &. No dependency upgrades. |
| `fairshare/tests/api.test.js` | Eleven tests covering API/session behavior with supplied mock responses; they do not contact Supabase. |
| Both READMEs and this guide | Setup, data flow, file map and verification limits. |

No Java source, database migrations, team prototypes, deployment configuration or Supabase settings were changed.

## How the connections work

1. index.html loads main.js.
2. main.js mounts App.vue.
3. App.vue displays the original landing page or an account/household view.
4. The views ask App.vue to perform an action.
5. api.js sends an HTTP request to the address in VITE_API_BASE_URL.
6. Spring Boot authenticates through Supabase Auth and accesses household tables in Supabase PostgreSQL.
7. The response comes back and Vue updates the screen.

### Routes used

| Screen action | Backend route |
|---|---|
| Create account | POST /api/auth/signup |
| Log in | POST /api/auth/login |
| Check signed-in user | GET /api/auth/me |
| Renew session | POST /api/auth/refresh |
| Log out | POST /api/auth/logout |
| Load households | GET /api/households |
| Create household | POST /api/households |

Opening household details uses the authenticated household list; no new detail endpoint is assumed.

## What points to Supabase?

The browser does not connect directly to Supabase. Existing backend configuration in `fairshare-backend/src/main/resources/application.properties` reads SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY for Auth, plus DB_URL, DB_USERNAME and DB_PASSWORD for the database. Existing AuthService, SupabaseConfig, SupabaseAuthClient and HouseholdService implement those connections. Never put database passwords or service-role keys into VITE_ variables; Vite includes those values in public browser code.

The existing household migration must already have been applied to the intended database. No additional tables are needed for this feature. Real signup and household creation do change that database when connected, so use agreed test accounts/data.

## What points to Vercel?

Vue does not need a Vercel-specific API. Vercel hosts the frontend build. In the frontend project's Environment Variables, configure VITE_API_BASE_URL with the stable backend origin, such as https://your-backend.example (an example, not an actual service). Set it separately for Preview/Production as appropriate, and rebuild after changes.

The backend's APP_ALLOWED_ORIGINS must include the exact frontend origin, including scheme and port. A new Vercel preview domain may need explicit backend approval/configuration. This branch does not broaden CORS or modify deployment accounts. No connection credentials or real production address have been guessed.

A Git branch is separate code history, not a database sandbox. If a preview is configured to use the production backend, account/household writes reach its real database. Prefer an agreed test environment for initial live verification.

## Can I use it like a normal website now?

The code implements real browser-to-backend integration. It works once a reachable backend, matching CORS settings, Supabase Auth and household tables are configured. The public backend URL was not supplied during development, so live hosted/Supabase verification is still required. The code does not silently switch to fake data if the backend is unavailable.

For localhost: run the Java backend on localhost:8080 with valid environment settings; run Vue on localhost:5173. Or set the frontend to a reachable hosted backend and allow localhost:5173 on that backend.

Current scope: login, signup, logout, session restore, household list/create/details. Invitations, inventory, expense and repayment operations remain separate tasks. Member records currently include UUIDs only, so the UI cannot show names/emails for other members without expanding the API. No fabricated names are inserted.

## Session behavior

The frontend stores only tokens, expiry and the returned user in sessionStorage for this tab. Passwords are never saved. Session survives refresh but is not a permanent remember-me system; browser restore behavior varies. Java/Supabase still verify tokens and permissions; the frontend guard is only navigation behavior.

Tokens are renewed shortly before expiry or once after an unauthorized response. Concurrent requests share renewal so rotating refresh tokens are not reused unnecessarily. Logout clears the local session even when the server cannot be reached; in that case a message says the server could not confirm logout. Server access tokens may remain valid until expiry, as documented by the existing backend.

Browser storage is accessible to JavaScript, so this design relies on avoiding script injection. A later HTTP-only-cookie design would require coordinated backend changes. No cookie-auth flow is claimed here.

Signup handles either an immediate session or a response requiring email confirmation. The confirmation URL is managed in Supabase; this UI does not parse tokens from email links or implement password reset.

## Checks run and remaining checks

- Eleven new API-client tests pass with controlled responses, including rotated tokens/concurrency, unauthorized responses, logout during renewal, bad configuration, signup confirmation and invalid input.
- Frontend production build passes.
- Browser QA against a disposable local HTTP fixture passed: login, household list/create, reload with restored session, logout and signup-confirmation message. This proves UI/API-contract wiring, not live Supabase connectivity.
- The original homepage component was compared with the base commit and found unchanged apart from its location.
- Existing backend tests were also run during integration review; results are reported with the change.

Before merging/releasing, verify with an agreed real test account:

1. Log in through the actual frontend/backend pair; wrong credentials should show a safe error.
2. Sign up with an approved test email, follow its confirmation link and log in.
3. Create a disposable household, refresh and see it again.
4. Another user must not see that household without membership; attempt access with another account.
5. Check renewal after token expiry and logout on the hosted environment.
6. Check a narrow/mobile screen and keyboard navigation, especially the create dialog.
7. Verify the homepage still shows its original image/fonts and links work.

The temporary browser-QA fixture is outside the repository, has made-up responses and never contacted the team's services. It is not an application mode.

## Finding the changes yourself

Open the FairShare Development folder in VS Code. Open Source Control to inspect changed files. Once committed, use the branch comparison/PR Files changed view, or run `git diff origin/main...HEAD` in that folder. The main comparison shows App.vue replaced by the coordinator plus the original content retained in LandingView.vue.

Start reading App.vue, then AuthView.vue and HouseholdsView.vue, then services/api.js. The service is where button actions become requests. Styling is separate in assets/account.css.

No merge into main or production deployment is part of this change. Integration with the actual service must be verified before describing it as a working hosted release.
