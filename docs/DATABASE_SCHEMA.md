# Page Builder V2: database schema (fresh Catalyst project)

Create these **10 tables** in the Catalyst Data Store of the V2 project. Nothing is reused from the old project.

Every table automatically gets `ROWID`, `CREATORID`, `CREATEDTIME` and `MODIFIEDTIME`. Do not add those yourself.

## How to read the tables

| Column in the tables below | Meaning |
|---|---|
| **Type** | Catalyst data type: `Var Char (n)` with max length n, `Text` (long text), `Int`, `BigInt`, `Boolean`, `DateTime` |
| **Search Index** | ✔ = turn on **Search Index**. These columns are used in `WHERE` filters, so indexing keeps lookups fast |
| **Unique** | ✔ = tick **Unique** |
| **Default** | set this default value when creating the column |

Other rules:

- **Is Mandatory: leave OFF for every column.** Some rows are saved in steps: a page is created first and its file keys are added next, and a multi-step lead is saved after step 1. The app checks required values itself.
- **PII/ePHI** (optional): you may switch it on for `Leads` `Name`, `Email`, `Phone` and `Lead_data`. Afterwards, check that leads still save and list correctly.
- Column names are **case-sensitive**. Type them exactly as shown.
- JSON values are stored in `Text` columns.
- After the first deploy, open **Settings → System check** in the app. It reads the real tables and lists any missing table or column.

Column names follow the original builder's naming (`pageSlug`, `Lead_data`, `File_Url`, …), so V1 data can be imported later without renaming.

---

## 1. Pages: landing pages

| Column | Type | Search Index | Unique | Default | Purpose |
|---|---|---|---|---|---|
| PageName | Var Char (255) | | | | internal page name |
| pageSlug | Var Char (255) | ✔ | ✔ | | URL part: `/p/<pageSlug>` |
| pageTitle | Var Char (255) | | | | SEO title |
| Description | Text | | | | meta description |
| Status | Var Char (50) | ✔ | | `Draft` | `Draft`, `Pending Approval`, `Approved`, `Rejected`, `Published`, `Unpublished` |
| IsLive | Boolean | ✔ | | false | a version is being served publicly |
| IsDeleted | Boolean | ✔ | | false | soft delete |
| CreatedVia | Var Char (20) | | | | `blank`, `template`, `ai`, `clone` |
| TemplateKey | Var Char (100) | | | | template the page started from |
| ProjectFileID | Var Char (255) | | | | Stratus key of the working draft (builder project JSON) |
| FileID | Var Char (255) | | | | Stratus key of the working draft (rendered HTML/CSS) |
| LiveFileID | Var Char (255) | | | | Stratus key of the HTML of the live version |
| CurrentVersion | Int | | | 0 | latest saved version number |
| ApprovedVersion | Int | | | 0 | version approved by marketing |
| LiveVersion | Int | | | 0 | version being served |
| FormConfig | Text | | | | JSON: form fields (derived from the page HTML on save) |
| formMapping | Text | | | | JSON: Zoho CRM mapping `{ "layoutId": "...", "fields": { "Last_Name": "full_name" } }` |
| Settings | Text | | | | JSON: lead rules (end date, response limit, captcha, duplicates…), theme, SEO, pixel |
| ThemeColor | Var Char (20) | | | | brand colour, for list cards |
| ThumbnailUrl | Text | | | | first image of the page, for cards |
| View_Count | BigInt | | | 0 | views |
| Lead_Count | BigInt | | | 0 | completed leads |
| OwnerName | Var Char (255) | | | | creator |
| OwnerEmail | Var Char (255) | ✔ | | | creator; used for "my pages" and edit rights |
| lastModifiedBy | Var Char (255) | | | | name of the last editor |
| SubmittedBy | Var Char (255) | | | | approval audit |
| SubmittedTime | DateTime | | | | |
| ReviewedBy | Var Char (255) | | | | |
| ReviewedTime | DateTime | | | | |
| ReviewComment | Text | | | | approval comment or rejection reason |
| PublishedBy | Var Char (255) | | | | |
| PublishedTime | DateTime | | | | |

## 2. PageVersions: snapshots (created on submit, publish and V1 conversion)

| Column | Type | Search Index | Unique | Default | Purpose |
|---|---|---|---|---|---|
| PageId | Var Char (30) | ✔ | | | Pages ROWID |
| VersionNo | Int | ✔ | | | 1, 2, 3… per page |
| ProjectKey | Var Char (255) | | | | Stratus key of the version's project JSON |
| HtmlKey | Var Char (255) | | | | Stratus key of the version's HTML/CSS |
| Source | Var Char (30) | | | | `submit`, `publish`, `legacy` |
| Note | Text | | | | submitter note |
| CreatedByName | Var Char (255) | | | | |

## 3. PageApprovals: workflow audit trail

| Column | Type | Search Index | Unique | Default | Purpose |
|---|---|---|---|---|---|
| PageId | Var Char (30) | ✔ | | | Pages ROWID |
| PageName | Var Char (255) | | | | page name at the time |
| Action | Var Char (30) | | | | `Submitted`, `Withdrawn`, `Approved`, `Rejected`, `Published`, `Unpublished`, `Edited`, `Deleted` |
| FromStatus | Var Char (50) | | | | |
| ToStatus | Var Char (50) | | | | |
| VersionNo | Int | | | 0 | |
| ActorName | Var Char (255) | | | | who did it |
| ActorEmail | Var Char (255) | | | | |
| Comment | Text | | | | |

## 4. Leads: lead capture, linked to page and channel

| Column | Type | Search Index | Unique | Default | Purpose |
|---|---|---|---|---|---|
| pageId | Var Char (30) | ✔ | | | Pages ROWID the lead came from |
| PageName | Var Char (255) | | | | page name at capture |
| PageSlug | Var Char (255) | | | | |
| Lead_data | Text | | | | JSON: all answers `{ fields, labels, steps, meta }` |
| Name | Var Char (255) | | | | extracted for search, lists and CRM |
| Email | Var Char (255) | ✔ | | | |
| Phone | Var Char (30) | ✔ | | | |
| Channel | Var Char (50) | ✔ | | | `Direct`, `Email`, `Facebook`, `Instagram`, `LinkedIn`, `Google Ads`, `Organic Search`, `QR Code`, `WhatsApp`, `Website Embed`, `Referral`, `SMS`, `YouTube`, `X (Twitter)`, `Other` |
| ChannelTag | Var Char (100) | | | | e.g. QR location tag `pune-branch` |
| utm_source | Var Char (200) | | | | |
| utm_medium | Var Char (200) | | | | |
| utm_campaign | Var Char (200) | ✔ | | | |
| utm_content | Var Char (200) | | | | |
| utm_term | Var Char (200) | | | | |
| Referrer | Text | | | | |
| LandingUrl | Text | | | | |
| DeviceType | Var Char (20) | | | | `Mobile`, `Tablet`, `Desktop` |
| LeadStatus | Var Char (30) | ✔ | | `New` | `New`, `Contacted`, `Qualified`, `Converted`, `Lost` |
| IsPartial | Boolean | ✔ | | false | multi-step form not finished yet |
| otpVerified | Boolean | | | false | mobile number verified by OTP |
| CRMSync | Var Char (20) | | | | `Synced`, `Failed`, `Pending`, `Skipped` |
| CRMId | Var Char (50) | | | | Zoho CRM record ID |
| CRMError | Text | | | | last sync error |
| Notes | Text | | | | JSON activity timeline `[{ type: note/status/crm, text, by, time }]` |

## 5. Media: image gallery (uploaded and AI-generated)

| Column | Type | Search Index | Unique | Default | Purpose |
|---|---|---|---|---|---|
| File_Name | Var Char (255) | | | | |
| File_Url | Text | | | | public URL (media bucket) |
| ObjectKey | Var Char (255) | | | | Stratus key, used to delete the image |
| Source | Var Char (20) | ✔ | | | `upload` or `ai` |
| MimeType | Var Char (50) | | | | |
| SizeBytes | BigInt | | | | |
| Prompt | Text | | | | AI prompt or upload description |
| NormalizedPrompt | Text | | | | normalised tokens for reuse matching |
| Tags | Text | | | | comma separated |
| Embedding | Text | | | | JSON vector (256 numbers) for semantic search and reuse |
| AspectRatio | Var Char (10) | | | | e.g. `16:9` |
| Model | Var Char (100) | | | | Gemini model used |
| UsageCount | Int | | | 0 | times inserted or reused |
| CreatedByName | Var Char (255) | | | | |

## 6. Templates: templates saved by users

The 10 system templates ship in code and need no rows.

| Column | Type | Search Index | Unique | Default | Purpose |
|---|---|---|---|---|---|
| Name | Var Char (255) | | | | |
| Category | Var Char (100) | | | | |
| Description | Text | | | | |
| ThumbnailUrl | Text | | | | |
| ProjectKey | Var Char (255) | | | | Stratus key |
| HtmlKey | Var Char (255) | | | | Stratus key |
| CreatedByName | Var Char (255) | | | | |

## 7. AIGenerations: AI usage log (cost tracking, debugging)

| Column | Type | Search Index | Unique | Default | Purpose |
|---|---|---|---|---|---|
| Kind | Var Char (30) | ✔ | | | `page_generate`, `page_modify`, `content_rewrite`, `content_seo`, `image_prompt`, `image_generate`, `image_reuse` |
| Prompt | Text | | | | |
| PageId | Var Char (30) | | | | |
| Model | Var Char (100) | | | | |
| Status | Var Char (20) | | | | `success`, `failed`, `blocked` (safety filter) |
| LatencyMs | Int | | | 0 | |
| InputTokens | Int | | | 0 | |
| OutputTokens | Int | | | 0 | |
| ErrorMessage | Text | | | | |
| ResultRef | Var Char (255) | | | | e.g. Media ROWID |
| CreatedByName | Var Char (255) | | | | |

## 8. PageViews: views per page, channel and day (conversion by channel)

| Column | Type | Search Index | Unique | Default | Purpose |
|---|---|---|---|---|---|
| PageId | Var Char (30) | ✔ | | | |
| Channel | Var Char (50) | ✔ | | | |
| ViewDate | Var Char (10) | ✔ | | | `YYYY-MM-DD` |
| ViewCount | Int | | | 0 | |

## 9. AppSettings: key/value configuration

| Column | Type | Search Index | Unique | Default | Purpose |
|---|---|---|---|---|---|
| SettingKey | Var Char (100) | ✔ | ✔ | | |
| SettingValue | Text | | | | |

Keys the app writes:

- **Zoho CRM connection:** `crm.refresh_token`, `crm.api_domain`, `crm.accounts_url`, `crm.connected_by`, `crm.connected_at`
- **reCAPTCHA:** `captcha.site_key`, `captcha.secret_key`

This table holds secrets. Give it **no** client or public permissions (see below).

## 10. Pincodes: pincode lookup for forms (optional data)

| Column | Type | Search Index | Unique | Default | Purpose |
|---|---|---|---|---|---|
| pincode | Var Char (6) | ✔ | | | |
| area_name | Var Char (255) | | | | one row per area |
| city | Var Char (100) | | | | |
| state | Var Char (100) | | | | |
| country | Var Char (50) | | | `India` | |

Load data in **Settings → Pincodes → Import CSV**, using the columns `pincode, area, city, state, country`.

---

## Table permissions

The function accesses the Data Store with admin scope, after its own role checks. Browsers never query tables directly.

For every table, remove all permissions for the **App User** and **public** roles. Only the function needs access.

## Stratus buckets

| Bucket | Access | Key layout |
|---|---|---|
| `pb-v2-pages` (`PAGES_BUCKET`) | **private** | `pages/<pageId>/draft/{project.json,render.json}`, `pages/<pageId>/v<N>/{project.json,render.json}`, `templates/<id>/…` |
| `pb-v2-media` (`MEDIA_BUCKET`) | **public read** | `media/uploads/<yyyy>/<mm>/<file>`, `media/ai/<yyyy>/<mm>/<file>` |

## Relationships

```
Pages 1 ── * PageVersions   (PageId)
Pages 1 ── * PageApprovals  (PageId)
Pages 1 ── * Leads          (pageId)
Pages 1 ── * PageViews      (PageId)
Media      reused across pages via File_Url (UsageCount counts uses)
```

The links are plain `Var Char` ROWID columns, not Catalyst foreign keys. A deleted page keeps its leads and history, and leads still show the page name.
