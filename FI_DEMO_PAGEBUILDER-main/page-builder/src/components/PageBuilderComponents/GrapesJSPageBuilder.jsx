import React, { useEffect, useRef, useState } from "react";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import grapesjsTailwind from "grapesjs-tailwind";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "antd/dist/reset.css";
import { PropagateLoader } from "react-spinners";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons"; // Import icons for delete and add
import {
  Modal,
  Button,
  Input,
  Select,
  Radio,
  Typography,
  Divider,
  Form,
  Spin,
} from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import templates from "./DraggableComponents/Templates";
import legacyTemplates from "./DraggableComponents/LegacyTemplates";
import portfolioTemplates from "./DraggableComponents/PortfolioTemplates";
import salesTemplates from "./DraggableComponents/SalesTemplates";
import campaignTemplates from "./DraggableComponents/CampaignTemplates";
import futuristicTemplates from "./DraggableComponents/FuturisticTemplates";
import festivalTemplates from "./DraggableComponents/FestivalTemplates";
import blogTemplates from "./DraggableComponents/BlogTemplates";
import websiteLayouts from "./DraggableComponents/websiteLayouts";
import StepFormBuilderModal from "./StepFormBuilderModal";
import { registerCustomComponents } from "./DraggableComponents/customComponents";
import {
  registerTemplateBlocks,
  registerWebsiteLayoutBlocks,
  removeDefaultBlocks,
} from "./DraggableComponents/grapesBlockRegistry";

const { Title, Text } = Typography;
const { Option } = Select;

const GrapesJSPageBuilder = () => {
  const editorRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [pageName, setPageName] = useState("");
  const [pageTitle, setPageTitle] = useState(""); // new
  const [slug, setSlug] = useState(""); // new
  const [isSlugUnique, setIsSlugUnique] = useState(true); // new
  const [slugLoading, setSlugLoading] = useState(false); // new
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false); //new
  const [statusToSave, setStatusToSave] = useState("");
  const [isStepCountModalVisible, setIsStepCountModalVisible] = useState(false);
  const [isStepBuilderVisible, setIsStepBuilderVisible] = useState(false);
  const [stepCount, setStepCount] = useState(1);
  const [configuredStepCount, setConfiguredStepCount] = useState(0);
  const [isReducingSteps, setIsReducingSteps] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [fieldsData, setFieldsData] = useState([]);
  const [loanValues, setLoanValues] = useState([]);

  const resetForm = () => {
    setPageName("");
    setPageTitle("");
    setSlug("");
    setIsSlugManuallyEdited(false);
    setIsSlugUnique(true);
    setSlugLoading(false);
    setFieldsData([]);
  };
  const fetchLoanValues = async () => {
    try {
      const response = await axios.get(
        "/server/verification/crm/meta/lead/loan-products",
      );
      setLoanValues(response.data.loanProductPicklistValues);
      // console.log("Loan Values = ", response.data.loanProductPicklistValues);
    } catch (error) {
      console.log("Error = ", error);
    }
  };
  useEffect(() => {
    fetchLoanValues();
  }, []);

  const navigate = useNavigate();

  // ── Debounced slug uniqueness check (mirrors PageTable clone modal) ──
  // Runs only while the modal is open and a slug exists. Fires 500 ms after
  // the user stops typing. Shows the Antd "validating" spinner via the
  // Form.Item's `hasFeedback` + `validateStatus="validating"`.
  useEffect(() => {
    if (!isModalVisible || !slug) {
      setSlugLoading(false);
      setIsSlugUnique(true); // empty slug → no error indicator
      return;
    }

    setSlugLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/server/page_builder_function/verify-slug?slug=${encodeURIComponent(slug)}`,
        );
        const data = await res.json();
        setIsSlugUnique(!!data.isUnique);
      } catch {
        setIsSlugUnique(false);
      } finally {
        setSlugLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [slug, isModalVisible]);

  const verifySlug = async (generatedSlug) => {
    try {
      setSlugLoading(true);
      const response = await axios.get(
        `/server/page_builder_function/verify-slug?slug=${generatedSlug}`,
      );
      setIsSlugUnique(response.data.isUnique);
    } catch (error) {
      console.error("Slug verification failed:", error);
      setIsSlugUnique(false);
    } finally {
      setSlugLoading(false);
    }
  };

  useEffect(() => {
    const escapeName = (name) =>
      `${name}`.trim().replace(/([^a-z0-9\w-:/]+)/gi, "-");

    const editor = grapesjs.init({
      container: "#gjs",
      height: "100%",
      fromElement: true,
      storageManager: false,
      selectorManager: { escapeName },
      plugins: [grapesjsTailwind],
    });

    editorRef.current = editor;

    // Wait for the panel to be rendered, then manipulate it
    editor.on("load", () => {
      const iframe = editor.Canvas.getFrameEl();
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

      // Inject Bootstrap CS
      const bootstrapCSSLink = iframeDoc.createElement("link");
      bootstrapCSSLink.rel = "stylesheet";
      bootstrapCSSLink.href = `${window.location.origin}/css/bootstrap.min.css`;
      iframeDoc.head.appendChild(bootstrapCSSLink);

      // Inject Bootstrap JS
      const bootstrapJSLink = iframeDoc.createElement("script");
      bootstrapJSLink.src = `${window.location.origin}/js/bootstrap.bundle.min.js`;
      bootstrapJSLink.defer = true;
      iframeDoc.body.appendChild(bootstrapJSLink);

      const tailwindJS = iframeDoc.createElement("script");
      tailwindJS.src = `${window.location.origin}/js/tailwind.js`;
      iframeDoc.head.appendChild(tailwindJS);

      const devicePanel = document.querySelector(".gjs-pn-devices-c");
      const selectElement = devicePanel.querySelector(".gjs-devices");

      // Hide the original select dropdown
      selectElement.style.display = "none";

      // Create custom icons for devices (Desktop, Tablet, Mobile Portrait, Mobile Landscape)
      const devicesContainer = document.querySelector(".gjs-devices-c");

      const devices = [
        { id: "desktop", label: "Desktop", iconClass: "fa fa-desktop" },
        { id: "tablet", label: "Tablet", iconClass: "fa fa-tablet" },
        {
          id: "mobilePortrait",
          label: "Mobile Portrait",
          iconClass: "fa fa-mobile",
        }, // Use fa-mobile instead of fa-mobile-alt
        {
          id: "mobileLandscape",
          label: "Mobile Landscape",
          iconClass: "fa fa-mobile",
        }, // Use fa-mobile here as well
      ];

      // Clear the devices container
      devicesContainer.innerHTML = "";

      // Add the new device icons
      devices.forEach((device) => {
        const iconButton = document.createElement("button");
        iconButton.classList.add("device-icon-btn");
        iconButton.setAttribute("data-device", device.id);
        iconButton.setAttribute("title", device.label);
        iconButton.innerHTML = `<i class="${device.iconClass}"></i>`;
        devicesContainer.appendChild(iconButton);

        // Add event listener for each button to switch device
        iconButton.addEventListener("click", () => {
          editor.setDevice(device.id); // Change device on editor
        });
      });

      // Add custom styles for buttons
      const style = document.createElement("style");
      style.innerHTML = `
          .gjs-pn-devices-c {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .device-icon-btn {
            background: none;
            border: none;
            padding: 2px;
            font-size: 14px; /* Smaller icon size */
            cursor: pointer;
            margin: 0 8px; /* Reduced margin */
          }
          .device-icon-btn:hover {
            color: #00A4FF; /* Change color on hover */
          }
          .device-icon-btn i {
            font-size: 18px; /* Adjust icon size */
          }
            #gjs-sm-move {
            display: none !important;
          }

        `;
      document.head.appendChild(style);
    });

    editor.Panels.removeButton("options", "export-template");

    //Custome Button Component

    const buttonBlock = {
      id: "custom-button",
      label: "Button",
      content: `
    <div class="custom-button-wrapper">
      <a href="#" class="btn btn-primary custom-button">
        <i class="bi bi-hand-thumbs-up"></i> Click Me
      </a>
    </div>`,
      category: "Button",
      attributes: { class: "fa fas fa-square", style: "font-size: 24px;" },
    };

    // Add the button block to the editor
    editor.BlockManager.add(buttonBlock.id, {
      label: buttonBlock.label,
      content: buttonBlock.content,
      category: buttonBlock.category,
      attributes: buttonBlock.attributes,
    });

    removeDefaultBlocks(editor);
    // Templates sit at the top of the block panel, in this order. Each call
    // returns the next free index so the sets stay in the order listed here
    // instead of being reversed.
    let blockAt = 0;
    blockAt = registerTemplateBlocks(editor, templates, blockAt);
    blockAt = registerTemplateBlocks(editor, legacyTemplates, blockAt);
    blockAt = registerTemplateBlocks(editor, portfolioTemplates, blockAt);
    blockAt = registerTemplateBlocks(editor, salesTemplates, blockAt);
    blockAt = registerTemplateBlocks(editor, campaignTemplates, blockAt);
    blockAt = registerTemplateBlocks(editor, futuristicTemplates, blockAt);
    blockAt = registerTemplateBlocks(editor, festivalTemplates, blockAt);
    blockAt = registerTemplateBlocks(editor, blogTemplates, blockAt);
    registerCustomComponents(editor);
    registerWebsiteLayoutBlocks(editor, websiteLayouts, blockAt);

    // Move style declaration here
    const customStyles = `
    .custom-video {
      border: 2px dashed #00A4FF;
      padding: 10px;
      display: inline-block;
    }
    .custom-image {
      border: 2px dashed #FF8B3D;
      padding: 10px;
      display: inline-block;
    }
  `;

    const styleElement = document.createElement("style");
    styleElement.innerHTML = customStyles;
    document.head.appendChild(styleElement);

    // Listen for when the block is added to the canvas and attach events
    editor.on("component:mount", (component) => {
      if (component.get("type") === "multi-step-form") {
        // Initialize the form step updating function on mount
        component.script();
      }
    });

    editor.Panels.addButton("options", [
      {
        id: "publish",
        className: "btn-publish",
        label: `<i class="fa fa-check-circle"></i>`, // FontAwesome icon for "Publish"
        command: () => showModal("Published"),
        attributes: {
          title: "Publish Page",
        },
      },
      {
        id: "draft",
        className: "btn-draft",
        label: `<i class="fa fa-save"></i>`, // FontAwesome icon for "Save Draft"
        command: () => showModal("Draft"),
        attributes: {
          title: "Save as Draft",
        },
      },
      {
        id: "add-step-form",
        className: "fa fa-plus-circle", // FontAwesome icon for "Add Step Form"
        // label: "Add Step Form",  // Keep label as it was before
        command: () => setIsStepCountModalVisible(true),
        attributes: {
          title: "Add a multi-step form",
        },
      },
    ]);

    // Add custom styles for buttons and overall theme
    const style = document.createElement("style");
    style.innerHTML = `
      .gjs-pn-commands, .gjs-pn-buttons, .gjs-pn-panel {
        background-color: #3d6fbc !important;
        color: #333 !important;
      }
      .custom-chip {
        display: inline-block;
        background-color: #00A4FF;
        color: #fff;
        margin-right: 10px;
        border-radius: 12px;
        font-size: 10px;
        cursor: pointer;
        padding: 0px 5px;
      }
      .btn-publish > .custom-chip {
        background-color: #28a745 !important;
      }
      .btn-draft > .custom-chip {
        background-color: #2a9df4 !important;
      }
      .btn-upload > .custom-chip {
        background-color: #ff8b3d !important;
      }
      .custom-chip:hover {
        background-color: #0096D6 !important;
      }
      .btn-publish, .btn-draft, .btn-upload {
        display: inline-block;
        margin-right: 5px !important;
      }
      .gjs-pn-buttons .gjs-pn-btn, .gjs-pn-commands .gjs-pn-btn {
        background-color: #E6F2FF !important;
        color: #333 !important;
        border: none !important;
      }
      .gjs-blocks-c {
        background-color: #F0F8FF !important;
      }
      .gjs-cv-canvas {
        background-color: #FFFFFF !important;
      }
      .gjs-title {
        background-color: #3d6fbc !important;
      }
      .gjs-block {
        background-color: #3d6fbc !important;
        border-radius: 8px;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      .gjs-block:hover {
        transform: translateY(-5px) scale(1.02);
        box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
      }
      .gjs-pn-btn:hover {
        background-color: #0096D6 !important;
        color: #fff !important;
      }
      .fa-plus-circle {
        margin-right: 60px;
      }
    `;
    document.head.appendChild(style);

    return () => {
      editor.destroy();
      document.head.removeChild(style);
    };
  }, []);

  const handleStepCountSubmit = () => {
    if (stepCount < 1) {
      toast.error("Step count must be at least 1.", {
        position: "top-right",
      });
      return;
    }

    if (stepCount > 5) {
      toast.error("Maximum 5 steps are allowed.", {
        position: "top-right",
      });
      return;
    }

    const currentMaxStep =
      fieldsData.length > 0
        ? Math.max(...fieldsData.map((field) => field.step))
        : 0;

    const existingConfiguredSteps =
      currentMaxStep > 0 ? currentMaxStep : stepCount;

    if (stepCount < existingConfiguredSteps) {
      setIsReducingSteps(true);
      setConfiguredStepCount(existingConfiguredSteps);
    } else {
      setIsReducingSteps(false);
      setConfiguredStepCount(stepCount);
    }

    setCurrentStep(1);
    setIsStepCountModalVisible(false);
    setIsStepBuilderVisible(true);
  };

  // Close modal and reset state
  const closeModal = () => {
    setIsStepCountModalVisible(false);
    setIsStepBuilderVisible(false);
    setCurrentStep(1);
  };

  const handleDeleteStep = (step) => {
    const updatedFields = fieldsData
      .filter((field) => field.step !== step)
      .map((field) => ({
        ...field,
        step: field.step > step ? field.step - 1 : field.step,
      }));

    const newMaxStep =
      updatedFields.length > 0
        ? Math.max(...updatedFields.map((field) => field.step))
        : 1;

    setFieldsData(updatedFields);
    setConfiguredStepCount(newMaxStep);
    setCurrentStep((prev) => Math.min(prev, newMaxStep));

    if (newMaxStep <= stepCount) {
      setIsReducingSteps(false);
    }
  };

  const renderFormInEditor = () => {
    const editor = editorRef.current;

    // Placeholder markup for dynamic form in the editor
    const placeholderHTML = `
<div class="dynamic-form container mt-4"
       style="
         padding: 30px;
         border: 2px dashed #4a90e2;
         border-radius: 8px;
         background-color: rgba(74,144,226,0.1);
         text-align: center;
         color: #333;
         box-shadow: 0 2px 8px rgba(0,0,0,0.1);
       ">
    <i class="fa fas fa-edit"
       style="font-size: 28px; margin-bottom: 12px; color: #4a90e2;">
    </i>
    <p style="margin: 0; font-size: 16px; font-weight: 500; color: #4a90e2;">
      Form preview area – your configured form will display here on the live site.
    </p>
    <p style="margin: 8px 0 0; font-size: 14px; color: #555; line-height: 1.4;">
      Please don’t edit or remove anything here. Use the ➕ icon in the Form panel to configure fields.
      You can adjust the dimensions and decoration of this placeholder via the editor UI, which will reflect on the live form.
    </p>
  </div>

`;

    // Add or update the block so users see the placeholder in editor
    editor.BlockManager.add("dynamic-form", {
      id: "dynamic-form",
      label: `
               <div style="text-align: center; padding: 10px;">
            <i class="fa fas fa-edit" style="font-size: 20px;"></i>
    <div style="margin-top: 5px; font-size: 12px; color:white;">Dynamic Form</div>          
    </div>
      `,
      category: "Dynamic Form",
      content: placeholderHTML, // Assuming fullHTML contains your form structure
    });
  };

  const saveHtmlToDatabase = async () => {
    // 1) Basic validation
    if (!pageName || !pageTitle || !slug) {
      toast.error("Please fill in Page Name, Page Title and Slug.", {
        position: "top-right",
      });
      return;
    }

    setLoading(true);

    // 2) Verify slug uniqueness before any upload
    try {
      const slugResp = await fetch(
        `/server/page_builder_function/verify-slug?slug=${encodeURIComponent(
          slug,
        )}`,
      );
      const slugData = await slugResp.json();

      if (!slugData.isUnique) {
        toast.error("Slug already exists. Please choose a different one.", {
          position: "top-right",
        });
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("Slug verification failed:", err);
      toast.error("Could not verify slug uniqueness.", {
        position: "top-right",
      });
      setLoading(false);
      return;
    }

    if (editorRef.current) {
      setLoading(true);
      const grapesHtml = editorRef.current.getHtml();
      const grapesCss = editorRef.current.getCss();

      // Embed form HTML into the GrapesJS content
      const embeddedHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>

            <title>${pageTitle}</title>
            <style>${grapesCss}</style>
            
        </head>
        <body>
            ${grapesHtml}
          
        </body>
        </html>
      `;

      // Prepare form data to send to the backend
      const formData = new FormData();
      const file = new Blob([embeddedHtml], { type: "text/html" });
      formData.append("files", file, `${pageName || "generated-page"}.html`);
      formData.append("status", statusToSave);
      formData.append("name", pageName);
      formData.append("slug", slug);
      formData.append("pageTitle", pageTitle);

      const captchadata = {
        step: stepCount, // Use dynamic `currentStep` variable here
        name: "captcha",
        type: "captcha",
        options: [],
        captchaValidation: "yes",
      };

      let newMetadatWithCaptcha = [];

      if (fieldsData.length != 0) {
        newMetadatWithCaptcha = [...fieldsData, captchadata];
      }

      if (newMetadatWithCaptcha.length != 0) {
        formData.append("stepformdata", JSON.stringify(newMetadatWithCaptcha)); // Convert fieldsData to a JSON string
        newMetadatWithCaptcha = [];
        setFieldsData([]);
      }

      // //console.log("Appending step form meta data:", JSON.stringify(fieldsData));

      try {
        console.log("HTML After Saving = ", formData);

        const response = await fetch(
          "/server/page_builder_function/save/page",
          {
            method: "POST",
            body: formData,
          },
        );

        setLoading(false);

        if (response.ok) {
          navigate("/all-pages");

          toast.success(`Page saved as ${statusToSave}!`, {
            position: "top-right",
          });
          resetForm();
          // setPageName(""); // Clear the page name field after successful save
          setIsModalVisible(false);

          // Clear the editor content
          editorRef.current.DomComponents.clear(); // Clears the HTML content
          editorRef.current.CssComposer.clear(); // Clears the CSS content
        } else {
          toast.error("Failed to upload file.", { position: "top-right" });
        }
      } catch (error) {
        setLoading(false);
        console.error("Error uploading file:", error);
        toast.error("An error occurred while uploading.", {
          position: "top-right",
        });
      }
    }
  };

  const showModal = (status) => {
    setStatusToSave(status);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <>
      <div style={{ height: "100vh", margin: 0 }}>
        {loading && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <PropagateLoader color="#3169be" size={15} />
          </div>
        )}

        {/* GrapesJS Editor Container */}
        <div id="gjs" style={{ height: "100vh" }}></div>
        <Modal
          title="Enter Page Details"
          open={isModalVisible}
          onOk={saveHtmlToDatabase}
          onCancel={handleCancel}
          okText="Submit"
          cancelText="Cancel"
          confirmLoading={loading}
          okButtonProps={(() => {
            const isDisabled =
              !pageName || !pageTitle || !slug || slugLoading || !isSlugUnique;
            return {
              disabled: isDisabled,
              style: isDisabled
                ? {}
                : { backgroundColor: "#3169be", borderColor: "#3169be" },
            };
          })()}
          width="50vw"
          styles={{
            body: { padding: "20px", maxHeight: "80vh", overflowY: "auto" },
          }}
        >
          <Form layout="vertical">
            <Form.Item label="Page Name">
              <Input
                placeholder="Enter Page Name"
                value={pageName}
                onChange={(e) => {
                  const value = e.target.value;
                  setPageName(value);
                  if (!isSlugManuallyEdited) {
                    setSlug(
                      value
                        .toLowerCase()
                        .replace(/[^\w\s-]/g, "")
                        .trim()
                        .replace(/\s+/g, "-"),
                    );
                  }
                }}
              />
            </Form.Item>

            <Form.Item label="Page Title">
              <Input
                placeholder="Enter Page Title"
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
              />
            </Form.Item>

            <Form.Item
              label="Slug"
              hasFeedback
              validateStatus={
                slug.length === 0
                  ? ""
                  : slugLoading
                    ? "validating"
                    : isSlugUnique
                      ? "success"
                      : "error"
              }
              help={
                slug.length === 0
                  ? "Slug is auto-generated from the page name. You can edit it manually."
                  : slugLoading
                    ? "Checking availability…"
                    : isSlugUnique
                      ? "✓ Slug is available"
                      : "✗ This slug is already taken. Please choose a different one."
              }
            >
              <Input
                value={slug}
                placeholder="auto-generated-slug"
                onChange={(e) => {
                  const value = e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, "")
                    .replace(/\s+/g, "-");
                  setSlug(value);
                  setIsSlugManuallyEdited(true);
                }}
              />
            </Form.Item>
          </Form>
        </Modal>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          style={{ zIndex: 2000, marginTop: "50px" }}
        />
      </div>

      <div style={{ height: "2vh" }}>
        {/* GrapesJS Editor Container */}
        {/* <div id="gjs" style={{ height: "100vh" }}></div> */}

        {/* Modal to enter number of steps */}
        <Modal
          title="Enter Number of Steps"
          visible={isStepCountModalVisible}
          onOk={handleStepCountSubmit}
          onCancel={closeModal}
          okText="Confirm"
          width={400}
        >
          <Input
            type="number"
            min={1}
            max={5}
            placeholder="Enter number of steps"
            value={stepCount}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (value <= 5) {
                setStepCount(value);
              }
            }}
            style={{ width: "100%", marginTop: "10px" }}
          />
        </Modal>

        {/* Step Forms for each step */}
        {isStepBuilderVisible &&
          currentStep <= (configuredStepCount || stepCount) && (
            <StepFormBuilderModal
              visible={isStepBuilderVisible}
              stepCount={stepCount}
              configuredStepCount={configuredStepCount || stepCount}
              isReducingSteps={isReducingSteps}
              onDeleteStep={handleDeleteStep}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              fieldsData={fieldsData}
              setFieldsData={setFieldsData}
              loanValues={loanValues}
              onClose={closeModal}
              onFinish={() => {
                renderFormInEditor();
                closeModal();
              }}
            />
          )}
      </div>
    </>
  );
};

export default GrapesJSPageBuilder;
