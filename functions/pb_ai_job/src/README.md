# pb_ai_job/src

Catalyst deploys every function from its own folder, so the job function
carries its own copy of the AI-related modules of
`new_page_builder_v_2_function/src`. Only these 23 files are needed:

```
config/index.js, config/roles.js
services/ai/*  (aiJobs, aiLog, contentGeneration, gemini.client, imageGeneration,
                imageReuse, pageGeneration, pageModification, prompts, schemas)
services/media.service.js, services/storage.service.js
shared/formMarkup.js, shared/pageDocument.js, shared/pageStyles.js, shared/sectionLibrary.js, shared/theme.js
utils/db.js, utils/html.js, utils/http.js, utils/text.js
```

The files keep the same paths and names as in the main function. When you
change one of them there, make the same change here. To see which copies
differ, run:

```
node scripts/check-job-copy.js
```
