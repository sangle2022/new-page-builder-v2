# Page Builder V2: web client

React 18 + Ant Design 5 + GrapesJS 0.22 (BSD-3). This client is hosted by Catalyst at `/app/` and talks to the `new_page_builder_v_2_function` function.

```
src/
  api/client.js            axios client and all API endpoints
  context/AuthContext.jsx  current user, role and permission checks
  layout/AppShell.jsx      sidebar and header
  pages/                   Dashboard, All pages, Approvals, Leads, Gallery, Templates, Reports, Settings
  components/              create-page modal, page actions, share/QR, history, media library, charts
  builder/
    Builder.jsx            editor screen (panels, save, workflow, images)
    AiPanel.jsx            AI chat editing
    PageSettingsDrawer.jsx SEO, lead rules, theme, CRM mapping
    formMarkup.js          GENERATED from the function: run `npm run sync-shared`
    grapes/                GrapesJS setup, AI operation applier, image filling
    classic/               V1 template blocks (loaded on demand)
public/css, public/js      Bootstrap/Tailwind for classic V1 blocks
```

Scripts:

- `npm start`: dev server. Use `catalyst serve` from the project root so `/server/...` calls reach the function.
- `npm run build`: production build (deployed by `catalyst deploy`).
- `npm run sync-shared`: regenerate `src/builder/formMarkup.js` from the function.

See [../docs/SETUP.md](../docs/SETUP.md) for configuration and deployment.
