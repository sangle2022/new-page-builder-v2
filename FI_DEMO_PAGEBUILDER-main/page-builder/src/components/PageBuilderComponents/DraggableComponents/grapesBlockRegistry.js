export const removeDefaultBlocks = (editor) => {
  const blocksByCategory = editor.BlockManager.getBlocksByCategory();

  const categoriesToRemove = [
    "Contact",
    "CTA",
    "Team",
    "Steps",
    "Statistics",
    "Pricing",
    "Fetaures",
    "Commerce",
    "Blog",
  ];

  blocksByCategory.forEach((category) => {
    if (
      category.category &&
      categoriesToRemove.includes(category.category.id)
    ) {
      category.items.forEach((block) => {
        editor.BlockManager.remove(block.id);
      });
    }
  });
};

// Blocks are placed at an explicit, incrementing index so the panel order
// matches the order they are registered in. Passing a fixed index for every
// block (the old `{ at: 0 }`) prepends each one, which silently reverses both
// the sets and the items inside them.
//
// Returns the next free index, so callers can chain several sets in order:
//   let at = 0;
//   at = registerTemplateBlocks(editor, templates, at);
//   at = registerTemplateBlocks(editor, blogTemplates, at);
export const registerTemplateBlocks = (editor, templates, startAt = 0) => {
  templates.forEach((template, i) => {
    editor.BlockManager.add(
      template.id,
      {
        label: template.label,
        content: template.content,
        category: template.category,
        // Not every template set defines an icon; avoid "fa undefined".
        attributes: { class: template.icon ? `fa ${template.icon}` : "fa" },
      },
      { at: startAt + i },
    );
  });
  return startAt + templates.length;
};

// Same ordering rule as registerTemplateBlocks. The old `{ at: 1 }` both
// reversed the layouts and inserted them between the first and second
// template, splitting the template list in two.
export const registerWebsiteLayoutBlocks = (
  editor,
  websiteLayouts,
  startAt = 0,
) => {
  websiteLayouts.forEach((layout, i) => {
    editor.BlockManager.add(
      layout.id,
      {
        category: "Custom Components",
        content: layout.content,
        label: `
          <i class="fa far fa-window-maximize" style="font-size: 2rem;"></i>
          <p style="margin-top: 6px;">${layout.label}</p>
        `,
      },
      { at: startAt + i },
    );
  });
  return startAt + websiteLayouts.length;
};