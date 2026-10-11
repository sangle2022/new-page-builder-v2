import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, notification, Select } from "antd";
import { PropagateLoader } from "react-spinners";
import CustomDataTable from "../../components/CustomDataTable";

const CrmEditing = ({ mappedData, layoutId, onClose, pageid, fetchpages }) => {
  const [crmFields, setCrmFields] = useState([]);
  const [crmData, setCrmData] = useState([]);
  const [selectedMappings, setSelectedMappings] = useState({});
  const [mandatoryFields, setMandatoryFields] = useState([]);
  const [isDataChanged, setIsDataChanged] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [actualdataBeforeSaving, SetactualDataBeforeSaving] = useState([]);

  // ── Pagination state ──────────────────────────────────────────────────────
  const [first, setFirst] = useState(0);
  const [rows, setRows]   = useState(10);

  const filterOutFields = [
    "Utm_Campaign",
    "Utm_Medium",
    "Utm_Term",
    "Utm_Content",
    "Utm_Source",
    "layoutId",
    "Landing_Page_Name",
  ];

  useEffect(() => {
    const fetchCrmFields = async () => {
      try {
        const response = await axios.get(
          `/server/verification/crm/meta/fields?layoutId=${layoutId}`
        );
        setCrmFields(response.data.fields);

        const mandatoryFieldApis = response.data.fields
          .filter((field) => field.is_mandatory)
          .map((field) => field.api_name);

        setMandatoryFields(mandatoryFieldApis);
      } catch (error) {
        console.error("Error fetching CRM fields:", error);
        setCrmFields([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (layoutId) {
      fetchCrmFields();
    }
  }, [layoutId]);

  useEffect(() => {
    if (mappedData && Object.keys(mappedData).length > 0) {
      const filteredMappedData = { ...mappedData };
      filterOutFields.forEach((field) => {
        delete filteredMappedData[field];
      });

      const preparedData = Object.entries(filteredMappedData).map(
        ([key, value]) => {
          const crmField = crmFields.find((field) => field.api_name === key);
          return {
            formFieldValue: value,
            crmFieldKey: key,
            crmFieldLabel: crmField ? crmField.label : key,
          };
        }
      );

      setCrmData(preparedData);
    }
  }, [mappedData, crmFields]);

  const handleMappingChange = (value, crmFieldKey, rowData) => {
    setSelectedMappings((prevMappings) => ({
      ...prevMappings,
      [crmFieldKey]: value,
    }));

    setCrmData((prevCrmData) => {
      const updatedCrmData = prevCrmData.map((item) => {
        if (
          item.crmFieldKey === crmFieldKey &&
          item.formFieldValue === rowData.formFieldValue
        ) {
          return { ...item, crmFieldKey: value, crmFieldLabel: "" };
        }
        return item;
      });
      return updatedCrmData;
    });

    setIsDataChanged(true);
  };

  const handleSave = () => {
    const crmFieldKeys = crmData.map((item) => item.crmFieldKey);

    const missingMandatoryFields = mandatoryFields
      .filter((field) => field !== "Lead_Source")
      .filter((field) => !crmFieldKeys.includes(field))
      .map((fieldApiName) => {
        const matchedField = crmFields.find((f) => f.api_name === fieldApiName);
        return matchedField ? matchedField.label : fieldApiName;
      });

    if (missingMandatoryFields.length > 0) {
      let errorMessage = `<ul style="padding-left: 20px;">`;
      errorMessage += missingMandatoryFields
        .map(
          (field, index) =>
            `<li><span style="color: #e74c3c; font-weight: bold;">${
              index + 1
            }.</span> ${field}</li>`
        )
        .join("");
      errorMessage += `</ul>`;

      notification.warning({
        message: "Mandatory Fields Missing",
        description: <div dangerouslySetInnerHTML={{ __html: errorMessage }} />,
        duration: 3,
      });

      return;
    }

    setVisible(true);
  };

  const confirmSave = () => {
    setIsSaving(true);

    const finalData = crmData.reduce((acc, row) => {
      acc[row.crmFieldKey] = row.formFieldValue;
      return acc;
    }, {});

    filterOutFields.forEach((field) => {
      if (mappedData[field]) {
        finalData[field] = mappedData[field];
      }
    });

    const textFormatData = JSON.stringify(finalData);
    console.log("Converted To String= ", textFormatData);

    axios
      .put(`/server/page_builder_function/update/page/${pageid}`, {
        formMapping: textFormatData,
      })
      .then((response) => {
        notification.success({
          message: "Mapping saved successfully!",
          duration: 3,
        });
        fetchpages();
        setIsSaving(false);
        setVisible(false);
        onClose();
      })
      .catch((error) => {
        console.error("Error saving the changes:", error);
        notification.error({
          message: "Failed to save the changes.",
          duration: 3,
        });
        setIsSaving(false);
      });
  };

  const cancelSave = () => {
    setVisible(false);
  };

  // ── Paginated slice ───────────────────────────────────────────────────────
  const pageData = crmData.slice(first, first + rows);

  const onPageChange = ({ first: newFirst, rows: newRows }) => {
    setFirst(newFirst);
    setRows(newRows);
  };

  // ── Column definitions ────────────────────────────────────────────────────
  const columns = [
    { field: "formFieldValue", header: "Form Fields" },
    {
      field: "crmFieldLabel",
      header: "CRM Fields",
      body: (rowData) => (
        <Select
          defaultValue={rowData.crmFieldLabel}
          style={{ width: 200 }}
          onChange={(value) =>
            handleMappingChange(value, rowData.crmFieldKey, rowData)
          }
          showSearch
          filterOption={(input, option) => {
            const optionText = React.Children.toArray(option.children)
              .map((child) =>
                typeof child === "string" ? child : child.props.children
              )
              .join("")
              .toLowerCase();
            return optionText.includes(input.toLowerCase());
          }}
        >
          {Array.isArray(crmFields) &&
            crmFields
              .filter(
                (field) =>
                  ![
                    "Lead_Source",
                    "Utm_Campaign",
                    "Utm_Medium",
                    "Utm_Term",
                    "Utm_Content",
                    "Utm_Source",
                  ].includes(field.api_name)
              )
              .map((field) => (
                <Select.Option key={field.api_name} value={field.api_name}>
                  {field.is_mandatory ? (
                    <span style={{ color: "red" }}>{field.label} *</span>
                  ) : (
                    field.label
                  )}
                </Select.Option>
              ))}
        </Select>
      ),
    },
  ];

  return (
    <Modal
      visible={true}
      title="Remap Crm Fields "
      onCancel={onClose}
      footer={[
        <Button key="back" onClick={onClose}>
          Close
        </Button>,
        isDataChanged && !isSaving ? (
          <Button key="submit" type="primary" onClick={handleSave}>
            Save Changes
          </Button>
        ) : null,
      ]}
      width={800}
    >
      {isLoading ? (
        <div style={{ textAlign: "center" }}>
          <PropagateLoader color="#3169BE" size={15} />
        </div>
      ) : (
        <CustomDataTable
          columns={columns}
          data={pageData}
          dataKey="formFieldValue"
          loading={false}
          emptyMessage="No mapped fields found."
          first={first}
          rows={rows}
          totalRecords={crmData.length}
          onPageChange={onPageChange}
          rowsPerPageOptions={[5, 10, 20, 50]}
          bottomPadding={300}
        />
      )}

      <Modal
        visible={visible}
        title="Save Changes"
        onCancel={cancelSave}
        footer={[
          <Button key="back" onClick={cancelSave}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={confirmSave}
            loading={isSaving}
          >
            Confirm
          </Button>,
        ]}
      >
        <p>Are you sure you want to save the changes?</p>
      </Modal>
    </Modal>
  );
};

export default CrmEditing;
