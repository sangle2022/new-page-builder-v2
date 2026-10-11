import React, { useMemo, useRef, useState } from "react";
import {
  Modal,
  Button,
  Input,
  Select,
  Radio,
  Typography,
  Divider,
  message,
  Checkbox,
  Tag,
} from "antd";
import {
  DeleteOutlined,
  PlusOutlined,
  HolderOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

const createFieldId = () =>
  `field_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const chipStyle = {
  marginLeft: "8px",
  padding: "1px 7px",
  borderRadius: "999px",
  fontSize: "10px",
  fontWeight: 600,
  display: "inline-block",
  lineHeight: 1.6,
  verticalAlign: "middle",
  whiteSpace: "nowrap",
};

const hiddenChipStyle = {
  ...chipStyle,
  backgroundColor: "#fff7e6",
  color: "#d48806",
  border: "1px solid #ffd591",
};

const validatorChipStyle = {
  ...chipStyle,
  backgroundColor: "#fff1f0",
  color: "#cf1322",
  border: "1px solid #ffa39e",
};

const multiChipStyle = {
  ...chipStyle,
  backgroundColor: "#f6ffed",
  color: "#389e0d",
  border: "1px solid #b7eb8f",
};

const sectionCardStyle = {
  marginTop: "14px",
  padding: "14px",
  background: "#ffffff",
  borderRadius: "10px",
  border: "1px solid #f0f0f0",
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
};

const fieldCardBaseStyle = {
  marginBottom: "18px",
  padding: "14px",
  background: "linear-gradient(180deg, #ffffff 0%, #fafafa 100%)",
  borderRadius: "12px",
  border: "1px solid #eaeaea",
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
};

const StepFormBuilderModal = ({
  visible,
  stepCount,
  configuredStepCount,
  isReducingSteps,
  onDeleteStep,
  currentStep,
  setCurrentStep,
  fieldsData,
  setFieldsData,
  loanValues,
  onClose,
  onFinish,
}) => {
  const [draggedFieldId, setDraggedFieldId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const [dropPosition, setDropPosition] = useState(null);
  const scrollContainerRef = useRef(null);

  const choiceTypes = ["dropdown", "multiSelect", "radio", "employeeType"];

  const isChoiceType = (type) => choiceTypes.includes(type);

  const getTrimmedOptions = (options = []) =>
    options.map((opt) => String(opt || "").trim());

  const getFieldValidationErrors = (field) => {
    const errors = {};

    if (!String(field.name || "").trim()) {
      errors.name = "Field label is required.";
    }

    if (isChoiceType(field.type)) {
      const trimmedOptions = getTrimmedOptions(field.options);
      const validOptions = trimmedOptions.filter(Boolean);

      if (validOptions.length === 0) {
        errors.options = "At least one option is required.";
      } else if (trimmedOptions.some((opt) => !opt)) {
        errors.options = "Blank options are not allowed.";
      }
    }

    return errors;
  };

  const getInvalidFieldsForStep = (stepNo, data = fieldsData) =>
    data
      .filter((field) => field.step === stepNo)
      .filter(
        (field) => Object.keys(getFieldValidationErrors(field)).length > 0,
      );

  const autoScrollWhileDragging = (clientY) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const threshold = 80;
    const scrollAmount = 22;

    if (clientY < rect.top + threshold) {
      container.scrollTop -= scrollAmount;
    } else if (clientY > rect.bottom - threshold) {
      container.scrollTop += scrollAmount;
    }
  };

  const resetDropState = () => {
    setDropTargetId(null);
    setDropPosition(null);
  };

  const renderDropPlaceholder = (targetId, position) => {
    const isActive = dropTargetId === targetId && dropPosition === position;

    if (!isActive || !draggedFieldId) return null;

    return (
      <div
        onDragOver={(e) => {
          e.preventDefault();
          autoScrollWhileDragging(e.clientY);
          setDropTargetId(targetId);
          setDropPosition(position);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          reorderFieldsWithinCurrentStep(draggedFieldId, targetId, position);
          setDraggedFieldId(null);
          resetDropState();
        }}
        style={{
          margin: position === "before" ? "0 0 12px 0" : "12px 0 0 0",
          padding: "10px 14px",
          borderRadius: "10px",
          border: "2px dashed #1677ff",
          background: "rgba(22,119,255,0.06)",
          color: "#1677ff",
          fontSize: "13px",
          fontWeight: 500,
          textAlign: "center",
          transition: "all 0.18s ease",
        }}
      >
        Drop here
      </div>
    );
  };

  const handleCardDragOver = (event, fieldId) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    autoScrollWhileDragging(event.clientY);

    if (!draggedFieldId || draggedFieldId === fieldId) return;

    const draggedIndex = currentStepFields.findIndex(
      (f) => f.id === draggedFieldId,
    );
    const targetIndex = currentStepFields.findIndex((f) => f.id === fieldId);
    if (draggedIndex === -1 || targetIndex === -1) return;

    // Direction-based: dragging up => drop before target, dragging down => drop after.
    // This is stable even when the placeholder shifts the layout.
    const position = draggedIndex > targetIndex ? "before" : "after";

    setDropTargetId(fieldId);
    setDropPosition(position);
  };

  const currentStepFields = useMemo(
    () => fieldsData.filter((field) => field.step === currentStep),
    [fieldsData, currentStep],
  );

  const totalVisibleSteps = configuredStepCount || stepCount;

  const getRequiredStepNumbers = () =>
    Array.from({ length: stepCount }, (_, index) => index + 1);

  const getEmptyConfiguredSteps = (data = fieldsData) =>
    getRequiredStepNumbers().filter(
      (stepNo) => !data.some((field) => field.step === stepNo),
    );

  const hasExceededSteps = (data = fieldsData) =>
    data.some((field) => field.step > stepCount);

  const getBlockingMessage = (data = fieldsData) => {
    if (hasExceededSteps(data)) {
      return `You selected ${stepCount} step(s). Please delete all exceeded step(s) before finishing.`;
    }

    const emptySteps = getEmptyConfiguredSteps(data);
    if (emptySteps.length > 0) {
      return `Each step must have at least one field. Please configure Step ${emptySteps.join(", Step ")} before finishing.`;
    }

    const invalidSteps = getRequiredStepNumbers().filter(
      (stepNo) => getInvalidFieldsForStep(stepNo, data).length > 0,
    );

    if (invalidSteps.length > 0) {
      return `Each field must have a label, and dropdown/multi-select/radio fields must have valid options. Please fix Step ${invalidSteps.join(", Step ")} before finishing.`;
    }

    return "";
  };

  const blockingMessage = getBlockingMessage(fieldsData);
  const isFinishBlocked =
    currentStep === totalVisibleSteps && Boolean(blockingMessage);

  const validatorTypes = ["phone", "pincode", "amountValidator"];
  const hiddenTypes = ["loanProduct"];
  const autoMandatoryTypes = [...validatorTypes, ...hiddenTypes];

  const hasExistingTypeElsewhere = (type, currentFieldId = null) => {
    return fieldsData.some(
      (field) => field.type === type && field.id !== currentFieldId,
    );
  };

  const isAutoMandatoryType = (type) => autoMandatoryTypes.includes(type);

  const handleAddField = (stepIndex) => {
    setFieldsData((prevData) => [
      ...prevData,
      {
        id: createFieldId(),
        step: stepIndex + 1,
        name: "",
        type: "text",
        options: [],
        required: "yes",
        visibilityRule: null,
        pincodeFields: [],
      },
    ]);
  };

  const handleFieldChange = (index, field, value) => {
    setFieldsData((prevData) =>
      prevData.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleRemoveField = (fieldId) => {
    setFieldsData((prevData) =>
      prevData.filter((field) => field.id !== fieldId),
    );
  };

  const handleBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getControllerFieldCandidates = (currentField) => {
    return fieldsData.filter(
      (f) =>
        f.id !== currentField.id &&
        ["dropdown", "radio", "multiSelect"].includes(f.type) &&
        Array.isArray(f.options) &&
        f.options.length > 0,
    );
  };

  const reorderFieldsWithinCurrentStep = (
    dragId,
    dropId = null,
    position = "after",
  ) => {
    if (!dragId || dragId === dropId) return;

    const stepFields = fieldsData.filter((f) => f.step === currentStep);
    const otherFields = fieldsData.filter((f) => f.step !== currentStep);

    const fromIndex = stepFields.findIndex((f) => f.id === dragId);
    if (fromIndex === -1) return;

    const updatedStepFields = [...stepFields];
    const [movedItem] = updatedStepFields.splice(fromIndex, 1);

    let insertIndex = updatedStepFields.length;

    if (dropId) {
      const targetIndex = updatedStepFields.findIndex((f) => f.id === dropId);
      if (targetIndex === -1) return;
      insertIndex = position === "before" ? targetIndex : targetIndex + 1;
    }

    updatedStepFields.splice(insertIndex, 0, movedItem);
    setFieldsData([...otherFields, ...updatedStepFields]);
  };

  const handleTypeChange = (field, value) => {
    const fieldIndex = fieldsData.findIndex((f) => f.id === field.id);

    if (value === "phone" && hasExistingTypeElsewhere("phone", field.id)) {
      message.error("Only one Phone validator field is allowed.");
      return;
    }

    if (value === "pincode" && hasExistingTypeElsewhere("pincode", field.id)) {
      message.error("Only one Pincode validator field is allowed.");
      return;
    }

    if (
      value === "loanProduct" &&
      hasExistingTypeElsewhere("loanProduct", field.id)
    ) {
      message.error("Only one Hidden field is allowed in the form.");
      return;
    }

    const baseUpdate = {
      ...field,
      type: value,
      required: isAutoMandatoryType(value) ? "yes" : field.required || "yes",
    };

    if (
      value === "dropdown" ||
      value === "multiSelect" ||
      value === "radio" ||
      value === "employeeType"
    ) {
      baseUpdate.options = Array.isArray(field.options) ? field.options : [];
    } else {
      baseUpdate.options = [];
    }

    if (value !== "phone") {
      delete baseUpdate.otpValidation;
    } else if (!baseUpdate.otpValidation) {
      baseUpdate.otpValidation = "no";
    }

    if (value !== "loanProduct") {
      delete baseUpdate.loanProductType;
    }

    if (value !== "amountValidator") {
      delete baseUpdate.minValue;
      delete baseUpdate.maxValue;
      delete baseUpdate.errorMessage;
    }

    if (value !== "number") {
      delete baseUpdate.digits;
    }

    if (value === "pincode") {
      baseUpdate.pincodeFields = Array.isArray(field.pincodeFields)
        ? field.pincodeFields
        : [];
    } else {
      delete baseUpdate.pincodeFields;
    }

    setFieldsData((prevData) =>
      prevData.map((item, idx) => (idx === fieldIndex ? baseUpdate : item)),
    );
  };

  const handleNextStep = () => {
    const updatedFieldsData = fieldsData.map((field) =>
      field.type === "phone" && !field.hasOwnProperty("otpValidation")
        ? { ...field, otpValidation: "no" }
        : isAutoMandatoryType(field.type)
          ? { ...field, required: "yes" }
          : field,
    );

    setFieldsData(updatedFieldsData);

    if (currentStep <= stepCount) {
      const currentStepFieldsData = updatedFieldsData.filter(
        (field) => field.step === currentStep,
      );

      if (currentStepFieldsData.length === 0) {
        message.error(
          `Step ${currentStep} must have at least one field before proceeding.`,
        );
        return;
      }

      const invalidFields = getInvalidFieldsForStep(
        currentStep,
        updatedFieldsData,
      );
      if (invalidFields.length > 0) {
        message.error(
          `Please complete all field labels and required options in Step ${currentStep} before proceeding.`,
        );
        return;
      }
    }

    if (currentStep < totalVisibleSteps) {
      setCurrentStep(currentStep + 1);
      return;
    }

    const finalBlockingMessage = getBlockingMessage(updatedFieldsData);

    if (finalBlockingMessage) {
      message.error(finalBlockingMessage);
      return;
    }
    console.log("Final JSON after configuration:", updatedFieldsData);

    onFinish(updatedFieldsData);
  };
  return (
    <Modal
      width={980}
      open={visible}
      onCancel={onClose}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              background: "#f0f5ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#2f54eb",
              fontWeight: 700,
            }}
          >
            {currentStep}
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>Configure Fields</div>
            <div style={{ fontSize: "12px", color: "#666" }}>
              Step {currentStep} of {configuredStepCount || stepCount}
            </div>
          </div>
        </div>
      }
      footer={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {isReducingSteps && currentStep > stepCount && (
              <Button
                key="delete-step"
                danger
                onClick={() => onDeleteStep(currentStep)}
              >
                Delete This Entire Step
              </Button>
            )}

            {currentStep > 1 && (
              <Button key="back" onClick={handleBackStep}>
                Back
              </Button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Button
              key="add"
              onClick={() => handleAddField(currentStep - 1)}
              icon={<PlusOutlined />}
              disabled={currentStep > stepCount}
            >
              Add Field
            </Button>

            <Button
              key="next"
              type="primary"
              onClick={handleNextStep}
              disabled={isFinishBlocked}
            >
              {currentStep < totalVisibleSteps ? "Next Step" : "Finish"}
            </Button>
          </div>
        </div>
      }
    >
      <div
        ref={scrollContainerRef}
        style={{
          maxHeight: "72vh",
          overflowY: "auto",
          paddingTop: "10px",
          paddingRight: "6px",
        }}
      >
        {blockingMessage && (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#fff2f0",
              border: "1px solid #ffccc7",
              color: "#a8071a",
              fontWeight: 500,
            }}
          >
            {blockingMessage}
          </div>
        )}

        {currentStepFields.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "30px 20px",
              border: "1px dashed #d9d9d9",
              borderRadius: "12px",
              background: "#fafafa",
              color: "#777",
            }}
          >
            No fields added for this step yet. Click <b>Add Field</b> to begin.
          </div>
        )}

        {currentStepFields.map((field, index) => {
          const fieldErrors = getFieldValidationErrors(field);

          return (
            <React.Fragment key={field.id}>
              {renderDropPlaceholder(field.id, "before")}

              <div
                draggable
                onDragStart={(e) => {
                  setDraggedFieldId(field.id);
                  resetDropState();
                  e.dataTransfer.effectAllowed = "move";
                  try {
                    e.dataTransfer.setData("text/plain", field.id);
                  } catch (_) {}
                }}
                onDragOver={(e) => handleCardDragOver(e, field.id)}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  reorderFieldsWithinCurrentStep(
                    draggedFieldId,
                    field.id,
                    dropPosition,
                  );
                  setDraggedFieldId(null);
                  resetDropState();
                }}
                onDragEnd={() => {
                  setDraggedFieldId(null);
                  resetDropState();
                }}
                style={{
                  ...fieldCardBaseStyle,
                  opacity: draggedFieldId === field.id ? 0.65 : 1,
                  border:
                    draggedFieldId === field.id
                      ? "1px solid #91caff"
                      : dropTargetId === field.id
                        ? "1px solid #69b1ff"
                        : fieldCardBaseStyle.border,
                  boxShadow:
                    dropTargetId === field.id
                      ? "0 0 0 3px rgba(22,119,255,0.12)"
                      : fieldCardBaseStyle.boxShadow,
                  transition: "all 0.18s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div
                      title="Drag to reorder"
                      style={{
                        cursor: "grab",
                        color: draggedFieldId === field.id ? "#1677ff" : "#999",
                        padding: "4px",
                        borderRadius: "6px",
                        background:
                          draggedFieldId === field.id
                            ? "#e6f4ff"
                            : "transparent",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <HolderOutlined style={{ fontSize: "18px" }} />
                    </div>
                    <Title level={5} style={{ margin: 0 }}>
                      Field {index + 1}
                    </Title>
                  </div>

                  <Button
                    onClick={() => handleRemoveField(field.id)}
                    danger
                    icon={<DeleteOutlined />}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div>
                    <Text strong>
                      Field Name <span style={{ color: "#ff4d4f" }}>*</span>
                    </Text>
                    <Input
                      placeholder="Enter field name"
                      value={field.name}
                      status={fieldErrors.name ? "error" : ""}
                      onChange={(e) =>
                        handleFieldChange(
                          fieldsData.findIndex((f) => f.id === field.id),
                          "name",
                          e.target.value,
                        )
                      }
                      style={{ marginTop: "6px" }}
                    />
                    {fieldErrors.name && (
                      <div
                        style={{
                          color: "#ff4d4f",
                          marginTop: "6px",
                          fontSize: "12px",
                        }}
                      >
                        {fieldErrors.name}
                      </div>
                    )}
                  </div>

                  <div>
                    <Text strong>Field Type</Text>
                    <Select
                      placeholder="Select Field Type"
                      value={field.type}
                      onChange={(value) => handleTypeChange(field, value)}
                      optionLabelProp="label"
                      style={{ width: "100%", marginTop: "6px" }}
                    >
                      <Option value="text" label="Text">
                        Text
                      </Option>

                      <Option value="number" label="Number">
                        Number
                      </Option>

                      <Option value="loanProduct" label="Loan Product">
                        <span>Loan Product</span>
                        <span style={hiddenChipStyle}>Hidden</span>
                      </Option>

                      <Option value="phone" label="Phone Number">
                        <span>Phone Number</span>
                        <span style={validatorChipStyle}>Validator</span>
                      </Option>

                      <Option value="email" label="Email">
                        Email
                      </Option>

                      <Option value="date" label="Date">
                        Date
                      </Option>

                      <Option value="dropdown" label="Dropdown">
                        Dropdown
                      </Option>

                      <Option value="multiSelect" label="Multi Select">
                        <span>Multi Select</span>
                        <span style={multiChipStyle}>Multiple</span>
                      </Option>

                      <Option value="radio" label="Radio Button">
                        Radio Button
                      </Option>

                      <Option value="amountValidator" label="Amount">
                        <span>Amount</span>
                        <span style={validatorChipStyle}>Validator</span>
                      </Option>

                      <Option value="pincode" label="Pincode">
                        <span>Pincode</span>
                        <span style={validatorChipStyle}>Validator</span>
                      </Option>
                    </Select>
                  </div>
                </div>

                {!isAutoMandatoryType(field.type) && (
                  <div style={{ ...sectionCardStyle }}>
                    <Text strong>Mandatory Field?</Text>
                    <div style={{ marginTop: "8px" }}>
                      <Radio.Group
                        value={field.required || "yes"}
                        onChange={(e) =>
                          handleFieldChange(
                            fieldsData.findIndex((f) => f.id === field.id),
                            "required",
                            e.target.value,
                          )
                        }
                      >
                        <Radio value="yes">Yes</Radio>
                        <Radio value="no">No</Radio>
                      </Radio.Group>
                    </div>
                  </div>
                )}

                {isAutoMandatoryType(field.type) && (
                  <div style={{ ...sectionCardStyle }}>
                    <Text strong>Mandatory Field</Text>
                    <div style={{ marginTop: "8px" }}>
                      <Tag color="red">Always Mandatory</Tag>
                    </div>
                  </div>
                )}

                {field.type === "loanProduct" && (
                  <div style={sectionCardStyle}>
                    <Text strong>Select Loan Product Type</Text>
                    <Select
                      value={field.loanProductType || undefined}
                      placeholder="Select loan product"
                      onChange={(value) =>
                        handleFieldChange(
                          fieldsData.findIndex((f) => f.id === field.id),
                          "loanProductType",
                          value,
                        )
                      }
                      style={{ width: "100%", marginTop: "8px" }}
                    >
                      {loanValues.map((item) => (
                        <Option key={item} value={item}>
                          {item}
                        </Option>
                      ))}
                    </Select>
                  </div>
                )}

                {field.type === "phone" && (
                  <div style={sectionCardStyle}>
                    <Text strong>Need OTP Validation?</Text>
                    <div style={{ marginTop: "8px" }}>
                      <Radio.Group
                        onChange={(e) =>
                          handleFieldChange(
                            fieldsData.findIndex((f) => f.id === field.id),
                            "otpValidation",
                            e.target.value,
                          )
                        }
                        value={field.otpValidation || "no"}
                      >
                        <Radio value="yes">Yes</Radio>
                        <Radio value="no">No</Radio>
                      </Radio.Group>
                    </div>
                  </div>
                )}

                {field.type === "pincode" && (
                  <div style={sectionCardStyle}>
                    <Text strong>Show Fields</Text>
                    <div style={{ marginTop: "8px" }}>
                      <Checkbox.Group
                        value={field.pincodeFields || []}
                        onChange={(checkedValues) =>
                          handleFieldChange(
                            fieldsData.findIndex((f) => f.id === field.id),
                            "pincodeFields",
                            checkedValues,
                          )
                        }
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "row",
                            gap: "8px",
                          }}
                        >
                          <Checkbox value="areaName">Area name</Checkbox>
                          <Checkbox value="city">City</Checkbox>
                          <Checkbox value="state">State</Checkbox>
                          <Checkbox value="country">Country</Checkbox>
                        </div>
                      </Checkbox.Group>
                    </div>
                  </div>
                )}

                {(field.type === "dropdown" ||
                  field.type === "multiSelect" ||
                  field.type === "radio" ||
                  field.type === "employeeType") && (
                  <div style={sectionCardStyle}>
                    <Divider orientation="left" plain style={{ marginTop: 0 }}>
                      Options <span style={{ color: "#ff4d4f" }}>*</span>
                    </Divider>

                    {field.options.map((option, optionIndex) => {
                      const isOptionBlank = !String(option || "").trim();

                      return (
                        <div
                          key={optionIndex}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "8px",
                          }}
                        >
                          <Input
                            placeholder={`Option ${optionIndex + 1}`}
                            value={option}
                            status={isOptionBlank ? "error" : ""}
                            onChange={(e) => {
                              const updatedOptions = [...field.options];
                              updatedOptions[optionIndex] = e.target.value;
                              handleFieldChange(
                                fieldsData.findIndex((f) => f.id === field.id),
                                "options",
                                updatedOptions,
                              );
                            }}
                          />
                          <Button
                            onClick={() => {
                              const updatedOptions = field.options.filter(
                                (_, idx) => idx !== optionIndex,
                              );
                              handleFieldChange(
                                fieldsData.findIndex((f) => f.id === field.id),
                                "options",
                                updatedOptions,
                              );
                            }}
                            danger
                            icon={<DeleteOutlined />}
                          />
                        </div>
                      );
                    })}

                    <Button
                      onClick={() =>
                        handleFieldChange(
                          fieldsData.findIndex((f) => f.id === field.id),
                          "options",
                          [...field.options, ""],
                        )
                      }
                      type="dashed"
                      icon={<PlusOutlined />}
                      style={{ marginTop: "6px" }}
                    >
                      Add Option
                    </Button>
                    {fieldErrors.options && (
                      <div
                        style={{
                          color: "#ff4d4f",
                          marginTop: "8px",
                          fontSize: "12px",
                        }}
                      >
                        {fieldErrors.options}
                      </div>
                    )}
                  </div>
                )}

                {field.type === "amountValidator" && (
                  <div style={sectionCardStyle}>
                    <Divider orientation="left" plain style={{ marginTop: 0 }}>
                      Amount Validation
                    </Divider>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "12px",
                      }}
                    >
                      <div>
                        <Text strong>Minimum Value</Text>
                        <Input
                          type="number"
                          placeholder="Enter Minimum Value"
                          value={field.minValue || ""}
                          onChange={(e) =>
                            handleFieldChange(
                              fieldsData.findIndex((f) => f.id === field.id),
                              "minValue",
                              e.target.value,
                            )
                          }
                          style={{ marginTop: "6px" }}
                        />
                      </div>

                      <div>
                        <Text strong>Maximum Value</Text>
                        <Input
                          type="number"
                          placeholder="Enter Maximum Value"
                          value={field.maxValue || ""}
                          onChange={(e) => {
                            const maxValue = e.target.value;
                            handleFieldChange(
                              fieldsData.findIndex((f) => f.id === field.id),
                              "maxValue",
                              maxValue,
                            );

                            if (
                              field.minValue &&
                              parseInt(maxValue, 10) <=
                                parseInt(field.minValue, 10)
                            ) {
                              handleFieldChange(
                                fieldsData.findIndex((f) => f.id === field.id),
                                "errorMessage",
                                "Maximum Value should be greater than Minimum Value.",
                              );
                            } else {
                              handleFieldChange(
                                fieldsData.findIndex((f) => f.id === field.id),
                                "errorMessage",
                                "",
                              );
                            }
                          }}
                          style={{ marginTop: "6px" }}
                        />
                      </div>
                    </div>

                    {field.errorMessage && (
                      <div style={{ color: "#ff4d4f", marginTop: "10px" }}>
                        {field.errorMessage}
                      </div>
                    )}
                  </div>
                )}

                {field.type === "number" && (
                  <div style={sectionCardStyle}>
                    <Text strong>Number of Digits</Text>
                    <Input
                      type="number"
                      min={1}
                      placeholder="Enter number of digits"
                      value={field.digits || ""}
                      onChange={(e) =>
                        handleFieldChange(
                          fieldsData.findIndex((f) => f.id === field.id),
                          "digits",
                          Number(e.target.value),
                        )
                      }
                      style={{ width: "100%", marginTop: "8px" }}
                    />
                  </div>
                )}

                <div style={sectionCardStyle}>
                  <Divider orientation="left" plain style={{ marginTop: 0 }}>
                    Conditional Visibility
                  </Divider>

                  <div style={{ marginBottom: "12px" }}>
                    <Text strong>Enable conditional visibility?</Text>
                    <div style={{ marginTop: "8px" }}>
                      <Radio.Group
                        value={field.visibilityRule ? "yes" : "no"}
                        onChange={(e) => {
                          const fieldIndex = fieldsData.findIndex(
                            (f) => f.id === field.id,
                          );

                          if (e.target.value === "yes") {
                            handleFieldChange(fieldIndex, "visibilityRule", {
                              controllerFieldId: "",
                              controllerValue: "",
                              action: "show",
                            });
                          } else {
                            handleFieldChange(
                              fieldIndex,
                              "visibilityRule",
                              null,
                            );
                          }
                        }}
                      >
                        <Radio value="yes">Yes</Radio>
                        <Radio value="no">No</Radio>
                      </Radio.Group>
                    </div>
                  </div>

                  {field.visibilityRule && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: "12px",
                      }}
                    >
                      <div>
                        <Text strong>Controlling Field</Text>
                        <Select
                          value={
                            field.visibilityRule.controllerFieldId || undefined
                          }
                          placeholder="Select controlling field"
                          style={{ width: "100%", marginTop: "6px" }}
                          onChange={(value) => {
                            const fieldIndex = fieldsData.findIndex(
                              (f) => f.id === field.id,
                            );
                            handleFieldChange(fieldIndex, "visibilityRule", {
                              ...field.visibilityRule,
                              controllerFieldId: value,
                              controllerValue: "",
                            });
                          }}
                        >
                          {getControllerFieldCandidates(field).map(
                            (controller) => (
                              <Option key={controller.id} value={controller.id}>
                                {controller.name || "(Unnamed Field)"} - Step{" "}
                                {controller.step}
                              </Option>
                            ),
                          )}
                        </Select>
                      </div>

                      <div>
                        <Text strong>Action</Text>
                        <Select
                          value={field.visibilityRule.action}
                          style={{ width: "100%", marginTop: "6px" }}
                          onChange={(value) => {
                            const fieldIndex = fieldsData.findIndex(
                              (f) => f.id === field.id,
                            );
                            handleFieldChange(fieldIndex, "visibilityRule", {
                              ...field.visibilityRule,
                              action: value,
                            });
                          }}
                        >
                          <Option value="show">
                            Show this field when matched
                          </Option>
                          <Option value="hide">
                            Hide this field when matched
                          </Option>
                        </Select>
                      </div>

                      <div>
                        <Text strong>Trigger Value</Text>
                        <Select
                          value={
                            field.visibilityRule.controllerValue || undefined
                          }
                          placeholder="Select trigger value"
                          style={{ width: "100%", marginTop: "6px" }}
                          onChange={(value) => {
                            const fieldIndex = fieldsData.findIndex(
                              (f) => f.id === field.id,
                            );
                            handleFieldChange(fieldIndex, "visibilityRule", {
                              ...field.visibilityRule,
                              controllerValue: value,
                            });
                          }}
                        >
                          {(
                            fieldsData.find(
                              (f) =>
                                f.id === field.visibilityRule.controllerFieldId,
                            )?.options || []
                          ).map((option) => (
                            <Option key={option} value={option}>
                              {option}
                            </Option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: "12px" }}>
                  <Tag color="blue">Step {field.step}</Tag>
                  {field.required === "yes" ? (
                    <Tag color="red">Mandatory</Tag>
                  ) : (
                    <Tag color="default">Optional</Tag>
                  )}
                  <Tag color="purple">{field.type}</Tag>
                </div>
              </div>
              {renderDropPlaceholder(field.id, "after")}
            </React.Fragment>
          );
        })}
        {draggedFieldId && currentStepFields.length > 0 && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              autoScrollWhileDragging(e.clientY);
              const lastField = currentStepFields[currentStepFields.length - 1];
              setDropTargetId(lastField.id);
              setDropPosition("after");
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const lastField = currentStepFields[currentStepFields.length - 1];
              reorderFieldsWithinCurrentStep(
                draggedFieldId,
                lastField.id,
                "after",
              );
              setDraggedFieldId(null);
              resetDropState();
            }}
            style={{ height: "12px" }}
          />
        )}
      </div>
    </Modal>
  );
};

export default StepFormBuilderModal;
