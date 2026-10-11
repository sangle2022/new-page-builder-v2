# Page Builder V2: setup and deployment

This guide takes a Catalyst project from empty to a working Page Builder V2. Steps 1–5 are one-time setup; step 7 is the deploy you repeat.

## 0. What you get

| Part | Where | URL after deploy |
|---|---|---|
| React app (builder, pages, approvals, leads, gallery, reports, settings) | `page-builder/` (Catalyst web client) | `https://<project-domain>/app/index.html` |
| API, published pages and lead capture | `functions/new_page_builder_v_2_function` (Advanced I/O, Node 24) | `https://<project-domain>/server/new_page_builder_v_2_function/…` |
| Published landing page | served by the function | `https://<project-domain>/server/new_page_builder_v_2_function/p/<slug>` |

## 1. Data Store tables

This is a fresh project, so create all 10 tables from [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md), with each column's exact name, type, index, unique and default settings:

- `Pages`
- `PageVersions`
- `PageApprovals`
- `Leads`
- `Media`
- `Templates`
- `AIGenerations`
- `PageViews`
- `AppSettings`
- `Pincodes`

Then remove App User and public permissions on every table; only the function accesses them.

After deploying, open **Settings → System check** in the app. It reads the real table schemas and lists every missing table or column.

## 2. Stratus buckets

| Bucket (env var) | Default name | Access | Holds |
|---|---|---|---|
| `PAGES_BUCKET` | `pb-v2-pages` | **private** | builder projects, page HTML, versions, saved templates |
| `MEDIA_BUCKET` | `pb-v2-media` | **public read** | gallery images (uploaded and AI-generated) that published pages show |

Pages are served only through the function, so the pages bucket must stay private.

## 3. Authentication and roles

1. Enable **Authentication** (hosted login) for the web client. Unsigned users are redirected to `/__catalyst/auth/login`.
2. In **Authentication → Roles**, create a role named **Marketing Team Member**.
3. Add users and give them roles. Catalyst roles map to app roles by name:

| Catalyst role | App role | Can |
|---|---|---|
| App Administrator, or any name containing "admin" | `admin` | everything, including settings, CRM connection and publishing without approval |
| a name containing "Marketing" (e.g. Marketing Team Member) | `marketing` | create and edit all pages, **approve or reject**, publish, manage leads, delete |
| a name containing "Viewer" | `viewer` | read-only: pages, leads, gallery, reports |
| any other role (e.g. App User) | `editor` | create and edit own pages, use AI, send for approval, publish once approved, work leads |

To map names explicitly, set `ROLE_MAP`, for example `{"Sales Team":"editor","Brand Team":"marketing"}`. The full matrix is in **Settings → Team & roles**.

Approval rules:

- With `REQUIRE_APPROVAL=true` (the default), a page can only go live after a marketing member approves the exact version that was submitted.
- Marketing members cannot approve their own submission. Admins can.
- Admins may publish directly.

## 4. Environment variables

Set these on the function: **Serverless → Functions → new_page_builder_v_2_function → Configuration → Environment variables**. Alternatively, put them in `deployment.env_variables` of `catalyst-config.json`, which is git-ignored.

[`.env.example`](../functions/new_page_builder_v_2_function/.env.example) lists every variable. These are the ones that matter:

| Variable | Required | Notes |
|---|---|---|
| `APP_SIGNING_SECRET` | **yes** | a random string of 32+ characters; signs OTP proofs, partial-lead tokens and the CRM OAuth state |
| `GEMINI_API_KEY` | for AI | from Google AI Studio; without it the app works, but AI features are disabled |
| `GEMINI_TEXT_MODEL` / `GEMINI_IMAGE_MODEL` / `GEMINI_EMBED_MODEL` | no | defaults `gemini-2.5-flash` / `gemini-2.5-flash-image` / `gemini-embedding-001` |
| `PAGES_BUCKET` / `MEDIA_BUCKET` | no | bucket names from step 2 |
| `REQUIRE_APPROVAL` | no | `true` (default) or `false` |
| `CRM_CLIENT_ID` / `CRM_CLIENT_SECRET` / `CRM_REDIRECT_URI` / `CRM_ACCOUNTS_URL` | for CRM | see step 5 |
| `OTP_PROVIDER` | no | `dummy` (code `123456`, for testing) or `karix`, which also needs the `KARIX_*` variables |
| `META_PIXEL_ID` | no | default Meta Pixel for published pages |

Never put real keys in source files. The repository ignores `.env` and `catalyst-config.json`.

## 5. Zoho CRM: Server-based Application

1. Go to <https://api-console.zoho.com> (use the data centre of your CRM account) → **Add client → Server-based Applications**.
2. Set **Homepage URL** to `https://<project-domain>/app/index.html`.
3. Set **Authorized Redirect URI** to `https://<project-domain>/server/new_page_builder_v_2_function/api/crm/callback`.
4. Copy the client ID and secret into `CRM_CLIENT_ID` and `CRM_CLIENT_SECRET`. Set `CRM_REDIRECT_URI` to the URI from step 3.
5. Set `CRM_ACCOUNTS_URL` for your data centre: `https://accounts.zoho.com`, `.in`, `.eu`, `.com.au` or `.jp`.
6. In the app, an admin opens **Settings → Zoho CRM → Connect Zoho CRM** and approves the consent screen.
   - The refresh token is stored in the `AppSettings` table, never in code.
   - Access tokens are cached in Catalyst Cache and refreshed automatically.
7. For each page, open the builder and go to **Page settings → CRM mapping**. Choose a layout and map the form fields (**Auto-map** helps).
   - Leads sync when they are submitted.
   - Failures show on the Leads screen, where they can be retried.

> **Security note.** The V1 project (`FI_DEMO_PAGEBUILDER-main`) contains a hardcoded CRM client ID and client secret (and a refresh token) in `functions/page_builder_function/catalyst-config.json`, `functions/integration/index.js` and `functions/verification/index.js`. **Revoke and rotate those credentials** in the Zoho API console, then use the new server-based application above.

## 6. reCAPTCHA, OTP and pincodes (optional)

- **reCAPTCHA v2 (checkbox).**
  - An admin enters the site key and secret in **Settings → reCAPTCHA**. They are stored in the `AppSettings` table.
  - Turn it on per page in **Page settings → Leads & rules**.
  - Tokens are verified on the server.
- **OTP.**
  - Select a mobile field in the builder and tick **Verify by OTP** in its settings.
  - Use `OTP_PROVIDER=karix` with the `KARIX_*` variables for real SMS.
- **Pincode autofill.**
  - Fill the `Pincodes` table in **Settings → Pincodes**, using the CSV columns `pincode, area, city, state, country`.
  - A form field of type *pincode* then fills city, state and area fields automatically.

## 6b. Background AI jobs (recommended): no 30-second limit

Catalyst stops a web request (Advanced I/O) after about 30 seconds. Most AI edits finish well within that. Generating a whole page, editing a large page, or using a slower model can take longer. With background jobs, the AI runs in a **Job function** (`pb_ai_job`), which can run for minutes, and the app polls for the result.

1. Deploy as usual. `catalyst deploy` also deploys `functions/pb_ai_job`.
   - The job function carries its own copy of the 22 AI-related source files (`functions/pb_ai_job/src`, listed in its README). When you change one of those files in the main function, make the same change there.
   - `node scripts/check-job-copy.js` lists any copies that differ.
2. In the Catalyst Console, go to **Job Scheduling → Job Pools → Create Job Pool**. Choose type **Function**, name it e.g. `pb_ai_pool`, and give it enough memory (512 MB or more).
3. Set environment variables:
   - **On `pb_ai_job`:** the same `GEMINI_*`, `PAGES_BUCKET`, `MEDIA_BUCKET` and `FUNCTION_NAME` values as the main function, plus `GEMINI_ADVANCED_MODEL`. See `functions/pb_ai_job/catalyst-config.example.json`.
   - **On `new_page_builder_v_2_function`:** `AI_JOBPOOL=pb_ai_pool`.

Without `AI_JOBPOOL`, AI runs inside the web request, as before. If submitting a job fails, the app also falls back to running inline.

### Which Gemini model does what

These were tested with this app's real requests in October 2026:

| Setting | Recommended | Used for | Notes |
|---|---|---|---|
| `GEMINI_TEXT_MODEL` | `gemini-2.5-flash` | Normal AI edits (a section, a field, a colour), rewrites, SEO; everything when background jobs are off | Edits take about 2–7 s; a full page about 12 s |
| `GEMINI_ADVANCED_MODEL` | `gemini-2.5-pro` | Full page generation and **whole-page design edits** ("make the page more premium", "improve the overall page"), **only inside the `pb_ai_job` background job** | Page generation about 25–35 s; whole-page edits about 1–2 min. Empty means the text model is used |
| `GEMINI_IMAGE_MODEL` | `gemini-3.1-flash-image` | Image generation | About 14 s. `gemini-2.5-flash-image` is being retired |
| `GEMINI_EMBED_MODEL` | `gemini-embedding-001` | Gallery search and image reuse | Changing it makes older gallery images less findable by meaning |

Notes from testing:

- `gemini-3.1-pro-preview` also produced good pages, about 24 s. It's a preview model, so prefer the stable `gemini-2.5-pro` for production.
- Gemini 3.x **Flash** models sometimes looped on AI edits, so keep `gemini-2.5-flash` as `GEMINI_TEXT_MODEL` until a newer Flash model has been re-tested.
- To see which models your key can use, call `GET https://generativelanguage.googleapis.com/v1beta/models` with the `x-goog-api-key` header.

## 7. Deploy

```bash
npm install -g zcatalyst-cli          # once
catalyst login
cd functions/new_page_builder_v_2_function && npm install && cd ../..
cd page-builder && npm install && cd ..
catalyst deploy
```

Local development: run `catalyst serve` from the project root, then open the client URL it prints.

## 8. Importing V1 data later (optional)

V2 starts empty. If you later import pages or leads from the old project, V2 can serve and edit them:

- **Page rows** need `PageName`, `pageSlug`, `Status = Published` and `FileID` (the Stratus key of the old HTML, copied into the pages bucket).
  - To keep the old step form, also add a `stepformdata` Text column to `Pages` and import it. It is converted to the V2 form, with OTP, captcha and dropdowns.
- **Imported live pages** keep serving at `/p/<slug>`.
- **Opening an imported page in the builder:** the first save converts it to a V2 page. The old content stays live until the converted version is approved and published.
- **Leads** keep working when their `pageId` points to the imported page's new ROWID.

## 9. Checks

- Run `cd functions/new_page_builder_v_2_function && npm test` to run the API, AI and V1-compatibility suites.
  - They use an in-memory mock of Catalyst and a stubbed Gemini, so no credentials are needed.
- After deploying, check **Settings → System check**. It should report no problems.
- Smoke test:
  1. Create a page from a template.
  2. Send it for approval.
  3. Approve it as a different marketing user.
  4. Publish it.
  5. Open a channel link from **Share**, for example WhatsApp, and submit the form.
  6. The lead appears in **Leads** with its channel and UTM campaign.

## 10. Maintenance notes

- `functions/…/src/shared/formMarkup.js` defines the lead-form HTML. The builder uses a generated copy. After changing it, run `node scripts/sync-shared.js` (or `npm run sync-shared` in `page-builder/`).
- `functions/pb_ai_job/src` holds copies of the AI-related files of the main function. Change both copies together, and check with `node scripts/check-job-copy.js`.
- Gemini usage is logged per request in `AIGenerations`. A summary is shown in **Reports → AI usage**.
- To raise or lower image reuse, set `IMAGE_REUSE_THRESHOLD` (embedding similarity, default `0.86`).
