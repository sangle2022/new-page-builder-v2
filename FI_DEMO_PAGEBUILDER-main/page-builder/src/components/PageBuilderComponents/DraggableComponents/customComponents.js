export const registerCustomComponents = (editor) => {
  registerMediaBlocks(editor);
  registerZFormLayouts(editor);
};

const registerZFormLayouts = (editor) => {
  editor.BlockManager.add("video-form-layout", {
    id: "video-form-layout",
    label: `
     <div style="text-align: center; padding: 10px;">
          <i class="fa fas fa-edit" style="font-size: 25px;"></i>
         <div style="margin-top: 5px; font-size: 12px; color:white;">Video + Form Layout</div>
        </div>
      `,
    category: "ZForm Layout",
    content: `
        <div class="flex flex-col md:flex-row gap-4 p-4 container">
          <!-- Video Section -->
          <div class="video-area w-full md:w-1/2 flex items-center justify-center">
            <video controls class="w-full h-full max-h-64 object-cover">
              <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4">
            </video>
          </div>
  <!-- Form Parent Section -->
      <div class="form-parent h-64 overflow-y-auto e hide-display-bar justify-center items-center w-full md:w-1/2">
      <!-- This is where the form will be dropped -->
      <div class="form-area w-full flex justify-center items-center"></div>
    </div>
  </div>
      `,
  });

  editor.BlockManager.add("only-form-layout", {
    id: "only-form-layout",
    label: `
        <div style="text-align: center; padding: 10px;">
      <i class="fa fas fa-edit" style="font-size: 25px;"></i>
    <div style="margin-top: 5px; font-size: 12px; color:white;">Only Form Layout</div>
    </div>

      `,
    category: "ZForm Layout",
    content: `
        <div class="flex flex-col p-4 container">
          <div class="form-parent h-64 overflow-y-auto e hide-display-bar justify-center items-center w-full">
            <div class="form-area w-full flex justify-center items-center">
              <form class="w-full max-w-full text-left"></form>
            </div>
          </div>
        </div>
      `,
  });

  editor.BlockManager.add("text-form-layout", {
    id: "text-form-layout",
    label: `
 <div style="text-align: center; padding: 10px;">
 <i class="fa fas fa-edit" style="font-size: 25px;"></i>
    <div style="margin-top: 5px; font-size: 12px; color:white;">Text + Form Layout</div>
    </div>
      `,
    category: "ZForm Layout",
    content: `
        <div class="flex flex-col md:flex-row gap-4 p-4 container">
    <!-- Text Section -->
  <div class="text-area w-full md:w-1/2 text-left">
    <h1 class="text-4xl font-bold italic">Your Heading</h1>
    <p class="text-gray-600 text-lg italic">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin vel ligula eu sapien interdum pretium. 
        Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
        exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit 
        in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non.
    </p>
</div>

    <!-- Form Parent Section -->
    <div class="form-parent h-64 overflow-y-auto e hide-display-bar justify-center items-center w-full md:w-1/2">
      <!-- This is where the form will be dropped -->
      <div class="form-area w-full flex justify-center items-center"></div>
    </div>
  </div>
  

      `,
  });
};

const registerMediaBlocks = (editor) => {
  const mediaBlocks = [
    {
      id: "draggable-video",
      label: "Video",
      content: `
        <div class="custom-video">
          <video controls style="max-width: 100%; height: auto;">
            <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      `,
      category: "Media",
      attributes: { class: "fa fa-film", style: "font-size: 24px;" },
    },
    {
      id: "draggable-image",
      label: "Image",
      content: `
        <div class="custom-image">
          <img src="https://via.placeholder.com/150" alt="Placeholder" style="max-width: 100%; height: auto;" />
        </div>
      `,
      category: "Media",
      attributes: { class: "fa fas fa-image", style: "font-size: 24px;" },
    },
  ];

  mediaBlocks.forEach((block) => {
    editor.BlockManager.add(
      block.id,
      {
        label: block.label,
        content: block.content,
        category: block.category,
        attributes: block.attributes,
      },
      { at: 2 },
    );
  });
};
