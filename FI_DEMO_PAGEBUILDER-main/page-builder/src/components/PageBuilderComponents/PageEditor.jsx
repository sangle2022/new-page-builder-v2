import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import grapesjsTailwind from "grapesjs-tailwind";
import { ToastContainer, toast } from "react-toastify";
import { PropagateLoader } from "react-spinners";
import "react-toastify/dist/ReactToastify.css";
import "antd/dist/reset.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Modal,
  Input,
  Button,
  Select,
  Typography,
  Divider,
  Radio,
  message,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
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

const { Option } = Select;
const { Title, Text } = Typography;
const { confirm } = Modal;

const MAX_VIDEO_SIZE_MB = 10;

const createFieldId = () =>
  `field_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

let captchaJsonarray = [];
let captchaObject = {};

const PageEditor = () => {
  const editorRef = useRef(null);
  const location = useLocation();
  const { htmlContent, rowId, initialPageName } = location.state || {};
  const [loading, setLoading] = useState(false);
  const [statusToSave, setStatusToSave] = useState("");
  const [formDeleteMessage, setFormDeleteMessage] = useState(false);
  const [stepCount, setStepCount] = useState(1);
  const [isStepModalVisible, setIsStepModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [fieldsData, setFieldsData] = useState([]);
  const [isStepCountModalVisible, setIsStepCountModalVisible] = useState(false);
  const [isReducingSteps, setIsReducingSteps] = useState(false);
  const [originalStepCount, setOriginalStepCount] = useState(0); // Store the original total steps before reduction
  const [buttonname, setButtonName] = useState("");
  const navigate = useNavigate();
  let fetchedData;
  const [loanValues, setLoanValues] = useState([]);

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

  const reInsertHtmlContent = async () => {
    //  console.log("Trying to insert the html content");

    try {
      const response = await fetch(
        `/server/page_builder_function/page/${rowId}`,
      );
      const htmlContent = await response.text();

      navigate(`/page-editor/${initialPageName}`, {
        state: {
          htmlContent,
          rowId: rowId,
          initialPageName: initialPageName,
        },
      });
    } catch (error) {
      toast.error("Error fetching page for editing.");
    } finally {
    }
  };

  const onSave = async (metadataText) => {
    //  console.log("Saved Metadata:", metadataText);

    try {
      const metasaveresponse = await axios.put(
        `/server/page_builder_function/update/page/${rowId}`,

        { stepformdata: metadataText },
      );

      //console.log("Saved Successfully :", metasaveresponse.data);
    } catch (error) {
      //console.log("Error Saving Meta Data :", error)
    }
  };

  useEffect(() => {
    setLoading(true); // Set loading to true initially
    const timer = setTimeout(() => {
      setLoading(false); // Set loading to false after 3 seconds
    }, 3000);

    const fetchPageMetadata = async () => {
      //console.log("Fetching Page Meta Data")
      try {
        //console.log("Inside Try Block")
        const response = await axios.get(
          `/server/page_builder_function/metadata/${rowId}`,
        );
        fetchedData = response.data.data[0].stepformdata;
        //  console.log(fetchedData);
        if (fetchedData == null) {
          //console.log("There is no metadata , setting static captcha object")

          captchaObject = {
            step: 1, // Set the step value as needed
            name: "Captcha",
            type: "captcha",
            options: [],
            captchaValidation: "yes", // Default value for captcha validation
          };

          setButtonName("Add Step Form");
          //console.log("Its Null")
        }
        //console.log(buttonname)

        if (fetchedData) {
          const parsedData = JSON.parse(fetchedData);

          const parsedDataWithIds = parsedData.map((field) => ({
            ...field,
            id: field.id || createFieldId(),
          }));

          const newparsed_data = parsedDataWithIds.filter(
            (field) => field.type !== "captcha",
          );
          //console.log("New Field Data By Removing Captcha = ", newparsed_data);

          // Filter the captcha-related fields
          captchaJsonarray = parsedData.filter(
            (field) => field.type === "captcha",
          );

          captchaObject = captchaJsonarray[0]; // Since you are sure there will be only one

          setFieldsData(newparsed_data);
          if (fieldsData != null) {
            //console.log("Setted Metadata by removing captcha = ",fieldsData)
          }
          const maxStep = Math.max(...parsedData.map((field) => field.step));
          setStepCount(maxStep);
          setOriginalStepCount(maxStep); // Set the original step count based on initial data
        }
      } catch (error) {
        console.error("Error fetching metadata:", error);
      }
    };

    fetchPageMetadata();

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

    if (htmlContent) {
      // Check if the HTML content contains the dynamic form class
      if (htmlContent.includes('class="dynamic-form container mt-4"')) {
        console.log("Dynamic form found in htmlContent.");
        setFormDeleteMessage(true);
      } else {
        console.log("❌ No dynamic form found in htmlContent.");
      }

      // Set the content in the editor
      editor.setComponents(htmlContent);
    }

    editorRef.current = editor;
    editor.Panels.removeButton("options", "export-template");

    editor.on("load", () => {
      const iframe = editor.Canvas.getFrameEl();
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

      // Inject Bootstrap CSS
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

    // Define commands for saving as published and draft
    editor.Commands.add("save-published", {
      run: () => handleSaveChanges("Published"),
    });

    editor.Commands.add("save-draft", {
      run: () => handleSaveChanges("Draft"),
    });

    // Add custom buttons directly into the existing left panel
    editor.Panels.addButton("options", [
      {
        id: "publish",
        className: "btn-publish",
        label: `<i class="fa fa-check-circle"></i>`,
        command: "save-published",
        attributes: { title: "Publish Page" },
      },
      {
        id: "draft",
        className: "btn-draft",
        label: `<i class="fa fa-save"></i>`,
        command: "save-draft",
        attributes: { title: "Save as Draft" },
      },
      {
        id: "edit-form",
        className: "fa fa-plus-circle",
        //  label: buttonname,
        command: () => showStepCountModal(),
        attributes: { title: "Edit Or Add Step Form" },
      },
    ]); // Tooltip on hover

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

    //Custom Button Componet Eneded

    registerCustomComponents(editor);
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
  }, [htmlContent, rowId]);

  const handleSaveChanges = async (status) => {
    setLoading(true);
    //console.log(statusToSave)
    setStatusToSave(status);
    try {
      let updatedHtml = editorRef.current.getHtml();
      // Parse the HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(updatedHtml, "text/html");

      // Remove any <title> tags from the parsed document
      const titleTags = doc.querySelectorAll("title");
      titleTags.forEach((title) => title.remove());

      // Update the original updatedHtml variable
      updatedHtml = doc.documentElement.outerHTML;
      const updatedCss = editorRef.current.getCss();

      // Parse the editor HTML to check for the specific class
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = updatedHtml;

      const hasDynamicForm = tempDiv.querySelector(
        ".dynamic-form.container.mt-4",
      );

      // Check if the form exists
      if (!hasDynamicForm) {
        //console.log("No, the form does not exist with the specified class.");

        // Make an API call to update `stepformdata` to null
        try {
          await axios.put(
            `/server/page_builder_function/update/page/${rowId}`,
            {
              stepformdata: null,
            },
          );
          if (formDeleteMessage) {
            setFieldsData([]);
            toast.success("Form From The Page Removed Successfully", {
              position: "top-right",
            });
          }
        } catch (axiosError) {
          // console.error("Error updating stepformdata to null:", axiosError);
          toast.error("Failed To Delete Form", {
            position: "top-right",
          });
          return; // Exit early to avoid saving the page
        }
      }

      const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  
    <style>${updatedCss}</style>
   
</head>
<body>${updatedHtml}</body>
</html>
            `;

      const formData = new FormData();
      const file = new Blob([fullHtml], { type: "text/html" });
      formData.append("files", file, `${initialPageName || "edited-page"}`);
      formData.append("status", status);
      formData.append("name", initialPageName || "edited-page");
      //formData.append("stepformdata",metadataText)

      const response = await fetch(
        `/server/page_builder_function/update/page/${rowId}`,
        {
          method: "PUT",
          body: formData,
        },
      );

      if (response.ok) {
        toast.success(`Page saved as ${status}!`, { position: "top-right" });
        reInsertHtmlContent();
      } else {
        toast.error("Failed to save the page.", { position: "top-right" });
      }
    } catch (error) {
      console.error("Error saving page:", error);
      toast.error("An error occurred while saving.", { position: "top-right" });
    } finally {
      setLoading(false);
    }
  };

  const groupedFields = fieldsData.reduce((acc, field) => {
    //console.log("Fields Data = ",fieldsData)
    const step = field.step;
    if (!acc[step]) acc[step] = [];
    acc[step].push(field);
    return acc;
  }, {});

  const showStepCountModal = () => setIsStepCountModalVisible(true);
  const showStepModal = () => {
    setIsStepModalVisible(true);
    setIsStepCountModalVisible(false);
  };

  const closeStepModal = () => setIsStepModalVisible(false);

  const handleStepCountChange = (value) => {
    const numericValue = Number(value);

    if (numericValue > 5) {
      message.warning("Maximum 5 steps are allowed.");
      setStepCount(5);
      return;
    }

    if (numericValue < 1) {
      setStepCount(1);
      return;
    }

    setStepCount(numericValue);
  };

  const handleStepCountSubmit = () => {
    const currentMaxStep =
      fieldsData.length > 0
        ? Math.max(...fieldsData.map((field) => field.step))
        : 1;

    if (stepCount < currentMaxStep) {
      setIsReducingSteps(true);
      setOriginalStepCount(currentMaxStep);
    } else {
      setIsReducingSteps(false);
      setOriginalStepCount(stepCount);
    }

    setCurrentStep(1);
    showStepModal();
  };
  const handleDeleteStep = (step) => {
    const remainingSteps = fieldsData.reduce((acc, field) => {
      if (field.step > acc) acc = field.step;
      return acc;
    }, 0);

    // Do not allow deleting below the selected final step count
    if (remainingSteps <= stepCount) {
      message.warning(`You must retain at least ${stepCount} step(s).`);
      return;
    }

    confirm({
      title: "Are you sure you want to delete this step?",
      icon: <ExclamationCircleOutlined />,
      content: `This will delete all fields in Step ${step}.`,
      onOk() {
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
        setOriginalStepCount(newMaxStep);
        setCurrentStep((prev) => Math.min(prev, newMaxStep));

        message.success(`Step ${step} deleted successfully`);
      },
      onCancel() {
        message.info("Step deletion canceled");
      },
    });
  };

  const renderFormInEditor = () => {
    const editor = editorRef.current;

    const fullHTML = `
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

    if (fetchedData == null) {
      //  console.log("Yes thier is no metadata , so rendering form...");
      editor.BlockManager.add("dynamic-form", {
        id: "dynamic-form",
        label: `
           <div style="text-align: center; padding: 10px;">
            <i class="fa fas fa-edit" style="font-size: 20px;"></i>
    <div style="margin-top: 5px; font-size: 12px; color:white;">Dynamic Form</div>          
    </div>
        `,
        category: "Dynamic Form",
        content: fullHTML, // Assuming fullHTML contains your form structure
      });
    } else {
      //    console.log("Meta data exist hence not rendering form..");
    }
  };

  const handleStepModalFinish = (updatedFieldsData) => {
    const title =
      buttonname === "Add Step Form"
        ? "Are You Sure You Want to Add The Step form preview on to The Blocks Manager ?"
        : "Are you sure you want to save changes?";

    const content =
      buttonname === "Add Step Form"
        ? "This will add a new step form preview to the Blocks Manager."
        : "This will save all your changes to the form configuration.";

    confirm({
      title,
      icon: <ExclamationCircleOutlined />,
      content,
      onOk() {
        renderFormInEditor();

        const fieldsWithoutCaptcha = updatedFieldsData.filter(
          (field) => field.type !== "captcha",
        );

        const updatedCaptchaObject = {
          ...captchaObject,
          step: stepCount,
        };

        const updatedMetadataWithCaptcha = [
          ...fieldsWithoutCaptcha,
          updatedCaptchaObject,
        ];

        const metadataText = JSON.stringify(updatedMetadataWithCaptcha);

        message.success("Form saved successfully");
        onSave(metadataText);
        closeStepModal();
      },
      onCancel() {
        message.info("Save operation canceled");
      },
    });
  };

  const handleBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFieldChange = (index, field, value) => {
    setFieldsData((prevData) =>
      prevData.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleAddField = (stepIndex) => {
    setFieldsData((prevData) => [
      ...prevData,
      { step: stepIndex + 1, name: "", type: "text", options: [] },
    ]);
  };

  const handleRemoveField = (fieldIndex) => {
    setFieldsData((prevData) =>
      prevData.filter((_, idx) => idx !== fieldIndex),
    );
  };

  useEffect(() => {
    const editor = editorRef.current;
    if (editor) {
      const button = editor.Panels.getButton("options", "edit-form");
      if (button) {
        button.set("label", buttonname); // Update the button label
      }
    }
  }, [buttonname]);

  return (
    <div
      style={{
        height: "100vh",
        margin: 0,
        backgroundColor: "#E3F2FD",
        position: "relative",
      }}
    >
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <PropagateLoader color="#3169BE" size={15} />
        </div>
      )}

      {/* GrapesJS Editor Container */}
      <div id="gjs" style={{ height: "100vh" }}></div>

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

      <Modal
        title="Edit Number of Steps"
        visible={isStepCountModalVisible}
        onOk={handleStepCountSubmit}
        onCancel={() => setIsStepCountModalVisible(false)}
        okText="Confirm"
      >
        <Input
          type="number"
          min={1}
          max={5}
          placeholder="Enter number of steps"
          value={stepCount}
          onChange={(e) => handleStepCountChange(e.target.value)}
          style={{ width: "100%", marginTop: "10px" }}
        />
      </Modal>

      {/* Step Configuration Modal */}
      {isStepModalVisible && currentStep <= originalStepCount && (
        <StepFormBuilderModal
          visible={isStepModalVisible}
          stepCount={stepCount}
          configuredStepCount={originalStepCount}
          isReducingSteps={isReducingSteps}
          onDeleteStep={handleDeleteStep}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          fieldsData={fieldsData}
          setFieldsData={setFieldsData}
          loanValues={loanValues}
          onClose={closeStepModal}
          onFinish={handleStepModalFinish}
        />
      )}
    </div>
  );
};

export default PageEditor;
