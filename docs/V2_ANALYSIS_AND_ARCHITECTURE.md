# Page Builder V2: Analysis and Architecture

This document covers what was reviewed before writing V2 code: the existing project, the reference HTML, the Catalyst tables, the gap between them, and the design decisions taken. Database details are in `DATABASE_SCHEMA.md`. Setup and deployment are in `SETUP.md`.

---

## 1. Existing system (FI_DEMO_PAGEBUILDER-main)

The reference project was read but not modified.

### 1.1 Shape

| Layer | What exists |
|---|---|
| Client | React 18 (CRA), HashRouter, Redux + TanStack Query, antd, MUI, PrimeReact and Bootstrap all mixed together |
| Builder | **GrapesJS 0.21** with `grapesjs-tailwind`. About 9,000 lines of HTML template blocks (Bootstrap/Tailwind based) and a few "ZForm layout" blocks |
| Functions | 5 Catalyst functions: `page_builder_function` (admin API, Express), `migration` (public API for published pages, Express), `verification` (OTP, captcha, CRM metadata, Express), `integration` (Datastore event that pushes leads to CRM), `authentication` (signup hook) |
| Storage | Page HTML in the Stratus bucket `fi-digital-pages`. Media in the `cms-file` bucket. Metadata in the Datastore |
| Tables | `Pages`, `Leads`, `Media`, `SYS_CONFIG`, `Pincodes` (matches the screenshots) |

### 1.2 Page lifecycle

1. The builder exports `getHtml()` and `getCss()` into a full HTML document. It is uploaded as a multipart file to `POST /save/page` and stored in Stratus. The Pages row holds `FileID`.
2. **Only rendered HTML is stored.** No GrapesJS project JSON is kept. Editing reloads the HTML with `setComponents(html)`, which loses component types and traits.
3. Status is a free string: `Draft`, `Published` or `Deleted` (soft delete). There is no approval step.
4. Published pages are served by the same SPA at `/#/<slug>`. `PageViewer` fetches metadata and HTML from the `migration` function, injects the body, and mounts a React `DynamicForm` through a portal into the `.dynamic-form` placeholder.

### 1.3 Forms and lead capture

- The form is defined outside the page HTML, in `Pages.stepformdata`: a flat array of fields with a `step` number, field types (text, phone, email, dropdown, pincode, amountValidator, loanProduct, captcha...) and visibility rules.
- Each step posts to `/server/migration/submit/form`. The first post creates a `Leads` row and later steps merge into it (`leadId`). This gives partial (abandoned) lead capture.
- The payload carries `pageId`, `Landing_Page_Name`, UTM params parsed from the hash, `otpVerified` and `Date_And_Time`. Everything is stored as one JSON string in `Leads.Lead_data`.
- **OTP is currently a dummy (`123456`).** The Karix integration exists but is not called. **reCAPTCHA is only checked in the browser**, never on the server. A pincode lookup uses the `Pincodes` table.

### 1.4 CRM

- `Pages.formMapping` = `{ CRM_api_name: form_field_name, ..., layoutId }`. It is built in Settings → CRM mapping from the Zoho CRM layout fields.
- The `integration` event function fires on Leads insert/update and **upserts** to `crm/v7/Leads/upsert` keyed on `Catalyst_Lead_ID`. It then writes `CRMSync` and `CRMId` back.
- Known defects: tokens are cached under a key that is never read back; `layoutId` is sent to CRM as a field; `CRMSync` is never set to false; **client secret and refresh token are hard-coded in source and in `catalyst-config.json`**.

### 1.5 Other features worth keeping

Dashboard KPIs and month-wise lead chart, view counter, page clone with slug check, soft delete, lead export via a Datastore bulk read job, Pincodes import/edit, captcha keys in `SYS_CONFIG`, per-page OTP/captcha toggles, Meta Pixel lead event.

### 1.6 Security and quality issues found (fixed in V2, not in the old project)

- ZCQL queries are built by string interpolation (slug, pageId, pincode, leadId), which allows injection.
- There is **no role-based authorization**. Role is display-only. Public endpoints expose the captcha secret.
- Secrets are committed to the repository. **The old CRM client secret and refresh token should be rotated.**
- Everything lives in single 800 to 2,000-line files.

---

## 2. Reference HTML ("Kite") concepts

| Area | Concepts |
|---|---|
| Home | Three ways to start (describe it to AI / template / block by block), KPI tiles, status filters with counts, cards or list view, a "things to look at" alert list, leads by channel |
| Page card | Status, views, leads, conversion %, link copy, lifecycle line ("closes on X or after N responses"), duplicate / take offline / share / leads |
| Builder | Blocks rail grouped by category, page layers with hide/reorder, desktop/tablet/mobile, hide panels (zen), undo, preview, coach steps, right panel tabs **Content / Style / Rules / Ask AI**, quick fixes |
| AI | Prompt studio (goal, industry, language, tone, brand colour, sections to include, "generate pictures", "mobile first"), a progress log, a draft summary, then edit. In-editor chat that applies targeted changes and reports what changed |
| Rules | Active-till date, response cap, closed message, after-submit action, dedupe repeat numbers, consent capture, bot protection |
| Share | Link and custom slug, website embed (inline / popup / full), QR code with a tag, WhatsApp message, email |
| Media | Upload, generate with AI (type and shape), "made by AI" filter, put on page |
| Leads | Filter by page and channel, a drawer with **Source: page name + URL + channel + identifier**, answers, history, status, CSV export, push to CRM |
| Reports | Funnel, channel table, device split, drop-off |
| Setup | Bring-your-own AI keys, outbound webhook, team, and a "who can do what" permission matrix |

There is no approval workflow in the HTML. That comes from the V2 requirements.

---

## 3. Gap analysis

| Existing | Required V2 | Decision |
|---|---|---|
| HTML-only storage | AI and manual editing on the same page, versions | Store **GrapesJS project JSON + rendered HTML** per draft, with version snapshots |
| Draft/Published/Deleted | Draft → Pending Approval → Approved/Rejected → Published/Unpublished | A workflow service with explicit transitions and audit rows |
| No authorization | Role-based (Marketing approver) | Catalyst roles mapped to app roles, with a permission check on every route |
| Form outside the page (`stepformdata`) | Forms editable manually **and** by AI | The form is a real GrapesJS component inside the page (fields as components with traits). The field schema is extracted on save into `Pages.FormConfig` |
| SPA hash route for public pages | Fast public pages with channel tracking | The function serves a complete HTML document at `/p/<slug>` with a small lead-capture runtime |
| `Lead_data` JSON only | Page, channel, campaign, status, created time | First-class columns for `pageId`, `PageName`, `Channel`, `utm_*`, `Referrer`, `LeadStatus`, plus the raw JSON |
| Templates are HTML blocks | Editable templates, AI-modifiable | Templates are **section specs** rendered by one section library (shared with AI generation). The classic HTML blocks are kept as a block category |
| Media list | Gallery with AI images and reuse | `Media` gains source, prompt, normalized prompt, tags, embedding and usage count. Similar prompts are looked up before generating |
| Hard-coded CRM tokens | Server-based OAuth app | A connect/callback flow; the refresh token is stored in the `AppSettings` table, never in code |
| Client-only captcha, dummy OTP | Real verification | Captcha is verified on the server. OTP is a pluggable provider (`dummy` for dev, `karix` via env) with a signed verification token |

---

## 4. V2 architecture

```
page-builder/ (React 18, antd, GrapesJS)              functions/new_page_builder_v_2_function/ (Express)
 ├─ app shell: auth (/api/me), role-aware nav           index.js → src/app.js
 ├─ Dashboard, All Pages, Approvals, Leads, Reports      ├─ middleware/  auth (user + role), permissions, errors
 ├─ Create page: Blank | Template | AI prompt studio      ├─ routes/ → controllers/ → services/
 ├─ Builder (GrapesJS)                                   │    pages, workflow, versions, templates, media,
 │   ├─ section library blocks (from API)                │    leads, analytics, settings, crm, ai, public
 │   ├─ lead form components (form/step/field)           ├─ services/ai/   gemini client, page generation,
 │   ├─ AI panel → structured operations                 │    page modification, content, image gen, reuse
 │   ├─ image gallery as asset manager                   ├─ services/crm/  oauth, metadata, sync
 │   └─ page settings, rules, versions, save/submit      ├─ shared/        section library, page CSS, templates
 └─ Media gallery, Templates, Settings                   └─ runtime/       lead-capture script for public pages
                     │                                           │
                     └──── /server/new_page_builder_v_2_function/api/*  (authenticated)
                           /server/new_page_builder_v_2_function/p/:slug, /api/public/* (public)
Catalyst: Datastore (tables) · Stratus (page JSON/HTML, media) · Cache (CRM token) · Authentication (users, roles)
```

**Single function, layered.** One Advanced I/O function keeps deployment simple. Public routes (`/p/*`, `/api/public/*`) need no session. Every `/api/*` route requires a signed-in Catalyst user and the permission for that action. Data access uses the admin-scoped SDK only after the app-level permission check passes.

### Roles

Catalyst Authentication is the source of users and roles. The role name is mapped to an app role. This can be overridden with the env `ROLE_MAP` (JSON).

| App role | Default Catalyst role match | Can |
|---|---|---|
| admin | `App Administrator` | everything, including settings, CRM, and deleting pages and leads |
| marketing | role name contains "marketing" | view all, approve/reject, publish/unpublish, manage leads, AI, media |
| editor | `App User` (default) | create and edit pages, use AI, upload media, submit for approval, view leads, publish **approved** pages they own |
| viewer | role name contains "viewer" or "read" | read only |

### Page workflow

```
          save (editor)                submit                approve (marketing)        publish
 Draft ──────────────────▶ Draft ───────────────▶ Pending Approval ───────────▶ Approved ─────────▶ Published (live)
   ▲                                                   │ reject + reason                              │ unpublish
   └──────────── edit ◀──────── Rejected ◀─────────────┘                                              ▼
   ▲                                                                                              Unpublished
   └── editing an Approved/Published page returns the working copy to Draft; the live version keeps serving
```

- Submitting snapshots a **version**. Approval approves that exact version. Publishing makes that version live (`LiveVersion`, `LiveFileID`). Edits after approval do not reach visitors until they are re-approved.
- Every transition writes a `PageApprovals` row (who, when, comment) and updates the audit columns on `Pages`.
- `REQUIRE_APPROVAL=false` (env) lets admins publish directly, for teams that don't want the gate.

### Lead capture

1. The public page `/p/<slug>` is rendered from the live version, with `window.__PB = { pageId, slug, api }` and `runtime.js`.
2. The runtime handles multi-step navigation, validation, OTP and pincode helpers, captcha and the success/redirect action.
3. It posts `{ pageId, fields, channel, utm_*, referrer, landingUrl, captchaToken, otpToken, partial }` to `/api/public/leads`.
4. The server re-checks that the page is live and open (date and response cap), verifies captcha and OTP, dedupes repeat phone/email numbers if enabled, and stores the lead with page and channel columns. It then tries a CRM sync (time-boxed) using the page's mapping.
5. **Channel** is resolved in this order: explicit `ch` param → `utm_source`/`utm_medium` normalization → referrer domain → `Direct`. Share links generated in the app already carry `ch` and UTM tags. QR codes carry `ch=qr_code` plus a tag.

---

## 5. Page builder library decision

**Keep GrapesJS** (BSD-3-Clause, fully free), upgraded to 0.22, and use it properly.

- It is already the editing model the team knows, and the classic template blocks keep working.
- It is a true component tree with traits, styles, undo, device views, layers and an asset manager. All of it is free.
- It has a programmatic API (`getWrapper().find()`, `replaceWith`, `append`, `addStyle`, `Css.setRule`), so **AI changes become component operations**. They are not HTML regeneration, so the result stays manually editable.
- Puck is MIT and has a good structured-AI idea, but it is React-component based. Moving to it would mean rewriting every template and losing free-form HTML editing.
- The Puck idea of "AI returns structured edits, not a new page" is adopted here: Gemini returns a JSON list of operations that the client applies to the GrapesJS tree.

What changes compared with V1: we now persist `getProjectData()` JSON, add custom component types (lead form, form step, form field) with traits, use a section library for blocks, replace the asset manager with the gallery, and add the AI panel.

---

## 6. AI architecture (Gemini)

All Gemini calls go through `services/ai/gemini.client.js` (REST, `x-goog-api-key`). Models come from env: `GEMINI_TEXT_MODEL`, `GEMINI_IMAGE_MODEL`, `GEMINI_EMBED_MODEL`. Swapping the provider means replacing that client only.

| Service | Input | Gemini output | Result |
|---|---|---|---|
| Page generation | prompt, goal, industry, tone, language, brand colour, sections, flags | **JSON via `responseSchema`**: page meta, theme tokens, ordered sections (type, variant, heading, text, items, form fields, image prompts) | The server renders the sections through the **section library** into GrapesJS-ready HTML. Images start as placeholders carrying `data-pb-image-prompt`, which the client fills one by one through the image service |
| Page modification | instruction, outline of sections (id, type, heading), HTML of the target section(s) or the selected element | **JSON operations**: `update_element`, `insert_section` (a section spec the server renders, which also covers "add a pricing section"), `remove_element`, `move_section`, `set_style`, `update_theme`, `update_settings` | The server validates and sanitises the operations; the client applies them to matching `data-pb-id` components as normal editor changes. One-click undo restores the snapshot taken before the request. Only the targeted components change |
| Content | text + instruction ("shorter", "Hindi"), page content for SEO, image idea | JSON `{ options[3] }` / `{ title, description, slug, keywords }` / `{ prompt, tags, alt }` | Inline rewrite, SEO fields, better image prompts |
| Image generation | prompt, kind, aspect ratio | inline image bytes | Stored in Stratus, row in `Media` with prompt metadata, returned as a URL |
| Image reuse | prompt | embedding (256 dims) | Cosine similarity against stored AI images (Jaccard on normalized tokens as a fallback). At or above threshold the existing image is offered/reused instead of generating. `UsageCount` is incremented |

Every AI call is logged in `AIGenerations` (kind, prompt, model, latency, tokens, status, page) for cost tracking.

---

## 7. Development plan (implementation order)

1. Backend foundation: config, auth/permissions, error handling, Datastore/Stratus helpers
2. Pages, versions and the approval workflow, with an audit trail
3. Public rendering, lead runtime, lead capture, channel/UTM, rules (date/cap/dedupe), captcha/OTP/pincode
4. Section library and system templates (10 industries)
5. Gemini client and AI services (generate, modify, content, image, reuse) plus AI logging
6. Media gallery (upload, AI, search, reuse)
7. CRM OAuth, metadata, field mapping and sync (auto and retry)
8. Analytics: dashboard KPIs, channels, funnel, monthly
9. Client: shell and roles → All Pages → Create (blank/template/AI) → Builder (forms, AI panel, gallery, settings, versions) → Approvals → Leads → Media → Templates → Reports → Settings
