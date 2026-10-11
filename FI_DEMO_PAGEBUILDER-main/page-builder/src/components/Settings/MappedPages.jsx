import React, { useState, useEffect, useMemo, useCallback } from "react";
import { PropagateLoader } from "react-spinners";
import { toast } from "react-toastify";
import { Button, Tooltip } from "antd";
import { EyeOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import CrmEditing from "./CrmEditing";
import { Modal } from "antd";
import "primeicons/primeicons.css";
import CustomNotification from "../CustomNotification";
import axios from "axios";
import CustomDataTable from "./../../components/CustomDataTable";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// ── Cache key ─────────────────────────────────────────────────────────────────
const QUERY_KEY = ["mapped-pages"];

export default function MappedPages() {
  const queryClient = useQueryClient();

  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false); // operations only (delete)
  const [selectedFormMapping, setSelectedFormMapping] = useState(null);
  const [layoutId, setLayoutId] = useState(null);
  const [mappedData, setMappedData] = useState({});
  const [showCrmEditing, setShowCrmEditing] = useState(false);
  const [rowid, setRowId] = useState("");
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [rowtodelete, setRowtodelete] = useState(null);
  const [notification, setNotification] = useState(null);

  // ── Pagination state ──────────────────────────────────────────────────────
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);

  const { data: queryData, isLoading: queryLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const response = await fetch(
        "/server/page_builder_function/mapped-pages",
      );
      const data = await response.json();
      if (!response.ok) throw new Error("Failed to fetch mapped pages.");

      const pages = (data.data || []).map((item) => item.Pages ?? item);
      return { ...data, data: pages };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // ── Sync TanStack cache → local state (only when local state is empty) ────
  useEffect(() => {
    if (!queryData || pages.length > 0) return;
    setPages(queryData.data || []);
  }, [queryData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Combined loader: query loading (initial) OR operation loading (delete)
  const showLoader = queryLoading || loading;
  const fetchPages = useCallback(async () => {
    //console.log("Reloading pages...");
    setPages([]); // clear local state so sync effect re-populates from fresh cache
    await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  }, [queryClient]);

  // Open form mapping popup
  const viewFormMapping = useCallback((rowData) => {
    if (rowData.formMapping) {
      try {
        const parsedFormMapping = JSON.parse(rowData.formMapping);
        setSelectedFormMapping(parsedFormMapping);
      } catch (error) {
        console.error("Error parsing formMapping:", error);
        toast.error("Error parsing formMapping data.");
      }
    } else {
      toast.info("No form mapping data available.");
    }
  }, []);

  const cancelSave = () => {
    setShowConfirmationModal(false);
  };

  // Close form mapping popup
  const closeFormMapping = () => {
    setSelectedFormMapping(null);
  };

  // Handle Delete Button Click
  const handleDeleteModal = useCallback((rowData) => {
    setRowtodelete(rowData);
    setShowConfirmationModal(true);
  }, []);

  const handleDelete = async () => {
    setLoading(true);
    if (rowtodelete) {
      const pageid = rowtodelete.ROWID;
      try {
        const deleteresponse = await axios.put(
          `/server/page_builder_function/update/page/${pageid}`,
          { formMapping: null },
        );
        if (deleteresponse.data.success) {
          setNotification({
            message: "Mapped Form Deleted Successfully",
            type: "success",
          });
          fetchPages();
        } else {
          setNotification({
            message: "Failed to delete the mapped form.",
            type: "error",
          });
        }
      } catch (error) {
        setNotification({
          message: "An error occurred while deleting the mapped form.",
          type: "error",
        });
      } finally {
        setLoading(false);
        setShowConfirmationModal(false);
      }
    }
  };

  // Handle Edit Button click
  const handleEdit = useCallback((rowData) => {
    const rowId = rowData.ROWID;
    let stringdate = rowData.formMapping;
    let parsedData = {};
    try {
      parsedData = JSON.parse(stringdate);
    } catch (error) {
      console.error("Error parsing formMapping:", error);
    }
    setMappedData(parsedData);
    setLayoutId(parsedData.layoutId);
    setShowCrmEditing(true);
    setRowId(rowId);
  }, []);

  // Close CrmEditing popup
  const closeCrmEditing = () => {
    setShowCrmEditing(false);
  };

  // ── Column definitions ────────────────────────────────────────────────────
  const columns = useMemo(
    () => [
      { field: "PageName", header: "Page Name" },
      { field: "Status", header: "Status" },
      {
        field: "CREATEDTIME",
        header: "Created Time",
        body: (rowData) =>
          rowData.CREATEDTIME
            ? new Date(rowData.CREATEDTIME).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })
            : "—",
      },
      {
        field: "MODIFIEDTIME",
        header: "Modified Time",
        body: (rowData) =>
          rowData.MODIFIEDTIME
            ? new Date(rowData.MODIFIEDTIME).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })
            : "—",
      },
      { field: "CreatedBy", header: "Created By" },
      {
        header: "Actions",
        body: (rowData) => (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {[
              {
                title: "View Mapping",
                icon: <EyeOutlined style={{ fontSize: 14 }} />,
                onClick: () => viewFormMapping(rowData),
                gradient: "linear-gradient(135deg, #1677ff, #4096ff)",
                shadow: "0 4px 12px rgba(22,119,255,0.4)",
                hoverShadow: "0 6px 16px rgba(22,119,255,0.55)",
              },
              {
                title: "Edit Mapping",
                icon: <EditOutlined style={{ fontSize: 14 }} />,
                onClick: () => handleEdit(rowData),
                gradient: "linear-gradient(135deg, #f59e0b, #f97316)",
                shadow: "0 4px 12px rgba(245,158,11,0.4)",
                hoverShadow: "0 6px 16px rgba(249,115,22,0.55)",
              },
              {
                title: "Delete Mapping",
                icon: <DeleteOutlined style={{ fontSize: 14 }} />,
                onClick: () => handleDeleteModal(rowData),
                gradient: "linear-gradient(135deg, #ef4444, #dc2626)",
                shadow: "0 4px 12px rgba(239,68,68,0.4)",
                hoverShadow: "0 6px 16px rgba(220,38,38,0.55)",
              },
            ].map(({ title, icon, onClick, gradient, shadow, hoverShadow }) => (
              <Tooltip key={title} title={title} placement="top">
                <button
                  onClick={onClick}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform =
                      "translateY(-2px) scale(1.08)";
                    e.currentTarget.style.boxShadow = hoverShadow;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow = shadow;
                  }}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    border: "none",
                    background: gradient,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: shadow,
                    transition: "transform 0.18s ease, box-shadow 0.18s ease",
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </button>
              </Tooltip>
            ))}
          </div>
        ),
      },
    ],
    [viewFormMapping, handleEdit, handleDeleteModal],
  );

  // ── Paginated slice ───────────────────────────────────────────────────────
  const pageData = useMemo(
    () => pages.slice(first, first + rows),
    [pages, first, rows],
  );

  const onPageChange = useCallback(({ first: newFirst, rows: newRows }) => {
    setFirst(newFirst);
    setRows(newRows);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "0px", maxWidth: "100%" }}>
      {/* Show loader while fetching data or during operations */}
      {showLoader && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(255, 255, 255, 0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <PropagateLoader color="#3169be" size={15} />
        </div>
      )}

      {/* Heading */}
      <h2 style={{ textAlign: "left", marginBottom: "20px", marginTop: "0px" }}>
        Mapped Pages
      </h2>

      <CustomDataTable
        columns={columns}
        data={pageData}
        dataKey="ROWID"
        loading={false}
        emptyMessage="No pages found."
        first={first}
        rows={rows}
        totalRecords={pages.length}
        onPageChange={onPageChange}
        rowsPerPageOptions={[5, 10, 20, 50]}
      />

      {/* Blur backdrop while mapping panel is open */}
      {selectedFormMapping && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 999,
            backdropFilter: "blur(4px)",
          }}
        />
      )}

      {/* Form Mapping Details — slide-in panel (right side) */}
      <Modal
        title={null}
        open={!!selectedFormMapping}
        onCancel={closeFormMapping}
        footer={null}
        width={520}
        closable
        closeIcon={
          <span
            style={{
              color: "#ffffff",
              fontSize: "22px",
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            ×
          </span>
        }
        centered={false}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          margin: 0,
          padding: 0,
          height: "100vh",
        }}
        styles={{
          content: {
            padding: 0,
            borderRadius: "18px 0 0 18px",
            overflow: "hidden",
            height: "100vh",
            boxShadow: "-8px 0 30px rgba(0,0,0,0.18)",
          },
          body: {
            padding: 0,
            height: "100vh",
            background: "#f6f8fb",
            overflow: "hidden",
          },
        }}
        maskClosable
      >
        {selectedFormMapping && (
          <div
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              background: "#f6f8fb",
            }}
          >
            {/* Header banner */}
            <div
              style={{
                background: "linear-gradient(135deg, #3169be, #1d437c)",
                padding: "22px 24px 18px",
                color: "#fff",
                position: "sticky",
                top: 0,
                zIndex: 2,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  paddingRight: "28px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      opacity: 0.85,
                      marginBottom: "6px",
                      letterSpacing: "0.4px",
                    }}
                  >
                    Mapping Details
                  </div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "22px",
                      fontWeight: 700,
                      lineHeight: 1.2,
                    }}
                  >
                    Form Mapping
                  </h2>
                </div>

                {/* Icon circle */}
                <div
                  style={{
                    minWidth: "72px",
                    height: "72px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.16)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px",
                    fontWeight: 700,
                    border: "1px solid rgba(255,255,255,0.2)",
                    backdropFilter: "blur(6px)",
                  }}
                >
                  🔗
                </div>
              </div>

              {/* Metadata pills */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px",
                  marginTop: "16px",
                }}
              >
                <div
                  style={{
                    background: "rgba(255,255,255,0.14)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    padding: "8px 12px",
                    borderRadius: "999px",
                    fontSize: "13px",
                  }}
                >
                  Total Fields:{" "}
                  <strong>{Object.keys(selectedFormMapping).length}</strong>
                </div>
                {selectedFormMapping.layoutId && (
                  <div
                    style={{
                      background: "rgba(255,255,255,0.14)",
                      border: "1px solid rgba(255,255,255,0.18)",
                      padding: "8px 12px",
                      borderRadius: "999px",
                      fontSize: "13px",
                    }}
                  >
                    Layout ID: <strong>{selectedFormMapping.layoutId}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Scrollable field cards */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
              <div
                style={{
                  background: "#fff",
                  borderRadius: "18px",
                  padding: "18px",
                  boxShadow: "0 6px 20px rgba(18,38,63,0.08)",
                  border: "1px solid #eef1f6",
                }}
              >
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#1f2937",
                    marginBottom: "16px",
                  }}
                >
                  CRM → Form Field Mapping
                </div>

                <div style={{ display: "grid", gap: "14px" }}>
                  {Object.entries(selectedFormMapping).map(
                    ([crmField, formField]) => (
                      <div
                        key={crmField}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "160px 1fr",
                          gap: "14px",
                          alignItems: "start",
                          padding: "14px 16px",
                          borderRadius: "14px",
                          background: "#f9fafc",
                          border: "1px solid #edf1f5",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#6b7280",
                            lineHeight: 1.5,
                            wordBreak: "break-word",
                          }}
                        >
                          {crmField}
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "#111827",
                            lineHeight: 1.6,
                            wordBreak: "break-word",
                          }}
                        >
                          {formField || (
                            <span
                              style={{ color: "#9ca3af", fontStyle: "italic" }}
                            >
                              N/A
                            </span>
                          )}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* CrmEditing Popup */}
      {showCrmEditing && (
        <CrmEditing
          fetchpages={fetchPages}
          mappedData={mappedData}
          layoutId={layoutId}
          onClose={closeCrmEditing}
          pageid={rowid}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmationModal && (
        <Modal
          visible={showConfirmationModal}
          title="Delete"
          onCancel={cancelSave}
          footer={[
            <Button key="back" onClick={cancelSave}>
              Cancel
            </Button>,
            <Button key="submit" type="primary" onClick={handleDelete}>
              Confirm
            </Button>,
          ]}
        >
          <p>Are you sure you want to delete this mapped page?</p>
        </Modal>
      )}

      {notification && (
        <CustomNotification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}
