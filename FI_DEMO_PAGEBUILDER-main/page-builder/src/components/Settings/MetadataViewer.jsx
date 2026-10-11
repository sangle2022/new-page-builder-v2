import React, { useState } from "react";
import { Select, Button, notification } from "antd";
import axios from "axios";
import CustomDataTable from "../../components/CustomDataTable";

const MetadataViewer = ({
  metadata,
  apiFields,
  layoutId,
  pageId,
  layoutName,
  onClose,
  onSubmit,
  fetchPages,
}) => {
  const [fieldMappings, setFieldMappings] = useState({});
  const [loading, setLoading] = useState(false);

 // console.log("Metadata = ", metadata)

  const handleMappingChange = (metadataFieldName, apiFieldName) => {
    setFieldMappings((prevMappings) => {
      const updatedMappings = { ...prevMappings };

      Object.keys(updatedMappings).forEach((key) => {
        if (updatedMappings[key] === metadataFieldName) {
          delete updatedMappings[key];
        }
      });

      updatedMappings[apiFieldName] = metadataFieldName;

      return updatedMappings;
    });
  };

  const handleSubmit = async () => {
    // Fields handled automatically via staticKeyValuePairs (user never maps these in UI)
    const STATIC_HANDLED_FIELDS = [
      "Lead_Source",
      "Utm_Campaign",
      "Utm_Medium",
      "Utm_Term",
      "Utm_Content",
      "Utm_Source",
      "Landing_Page_Name",
    ];

    const unmappedMandatoryFields = apiFields
      .filter(
        (apiField) =>
          apiField.is_mandatory &&
          !STATIC_HANDLED_FIELDS.includes(apiField.api_name),
      )
      .filter(
        (apiField) => !Object.keys(fieldMappings).includes(apiField.api_name),
      );

    if (unmappedMandatoryFields.length > 0) {
      const errorMessage =
        `Please Map All The Below Mandatory Fields Before Submitting.<br/><ul style="padding-left: 20px;">` +
        unmappedMandatoryFields
          .map(
            (field, index) =>
              `<li><span style="color: #e74c3c; font-weight: bold;">${
                index + 1
              }.</span> ${field.label}</li>`,
          )
          .join("") +
        `</ul>`;

      notification.error({
        message: "Field Mapping Required",
        description: <div dangerouslySetInnerHTML={{ __html: errorMessage }} />,
      });

      return;
    }

    const staticKeyValuePairs = {
      Utm_Campaign: "utm_campaign",
      Utm_Medium: "utm_medium",
      Utm_Term: "utm_term",
      Utm_Content: "utm_content",
      Utm_Source: "utm_source",
      Landing_Page_Name: "Landing_Page_Name",
    };

    const finalMapping = { ...fieldMappings, ...staticKeyValuePairs, layoutId };

    try {
      console.log("Final Mapping = ", JSON.stringify(finalMapping));
      setLoading(true);
      const response = await axios.put(
        `/server/page_builder_function/update/page/${pageId}`,
        {
          formMapping: JSON.stringify(finalMapping),
        },
      );
      notification.success({
        message: "Success",
        description: "Form Mapping Saved successfully.",
      });
      onSubmit(finalMapping);
    } catch (error) {
      notification.error({
        message: "Error",
        description:
          error.response?.data?.message || "Failed to update metadata.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Exclude static fields and captcha fields from metadata
  const filteredMetadata = metadata.filter(
    (row) =>
      !["Utm_Campaign", "Utm_Medium", "Utm_Term", "Utm_Content"].includes(
        row.name,
      ) && row.type !== "captcha",
  );

  // ── Column definitions ────────────────────────────────────────────────────
  const columns = [
    { field: "name", header: "Field Name" },
    { field: "type", header: "Field Type" },
    { field: "step", header: "Step" },
    {
      header: "Map to API Field",
      body: (rowData) => (
        <Select
          placeholder="Select API Field"
          style={{ width: "100%" }}
          onChange={(value) => handleMappingChange(rowData.name, value)}
          showSearch
          filterOption={(input, option) => {
            const optionText = option.children?.toString()?.toLowerCase();
            return optionText?.includes(input.toLowerCase());
          }}
        >
          {apiFields
            .filter(
              (field) =>
                ![
                  "Lead_Source",
                  "Utm_Campaign",
                  "Utm_Medium",
                  "Utm_Term",
                  "Utm_Content",
                  "Utm_Source",
                ].includes(field.api_name),
            )
            .map((apiField) => (
              <Select.Option
                key={apiField.api_name}
                value={apiField.api_name}
                style={apiField.is_mandatory ? { color: "red" } : {}}
              >
                {apiField.label}
                {apiField.is_mandatory && (
                  <span style={{ color: "red", marginLeft: "5px" }}>*</span>
                )}
              </Select.Option>
            ))}
        </Select>
      ),
    },
  ];

  return (
    <>
      {/* Layout Name and Module headings */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
          marginBottom: "20px",
        }}
      >
        <h2>Layout: {layoutName}, Module: Leads</h2>
      </div>

      {/* Table — bottomPadding leaves room for the footer buttons below */}
      <div style={{ flex: 1, paddingBottom: "20px" }}>
        <CustomDataTable
          columns={columns}
          data={filteredMetadata}
          dataKey="name"
          loading={false}
          emptyMessage="No fields found."
          bottomPadding={160}
        />
      </div>

      {/* Footer buttons */}
      <div
        style={{
          marginTop: "20px",
          display: "flex",
          justifyContent: "center",
          gap: "50px",
        }}
      >
        <Button onClick={onClose}>Back</Button>
        <Button type="primary" onClick={handleSubmit} loading={loading}>
          Submit
        </Button>
      </div>
    </>
  );
};

export default MetadataViewer;
