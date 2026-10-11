import React, { useState, useEffect, useMemo, useCallback } from "react";
import { PropagateLoader } from "react-spinners";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import { Modal } from "antd";
import { useSelector, useDispatch } from "react-redux";
import { pincodeActions } from "../../store/pincodeSlice";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import "primeicons/primeicons.css";
import CustomDataTable from "../../components/CustomDataTable"; // adjust path as needed

// Fields used in both the edit modal and the preview table
const PINCODE_FIELDS = [
  { field: "area_name", label: "Area Name" },
  { field: "pincode", label: "Pincode" },
  { field: "city", label: "City" },
  { field: "state", label: "State" },
  { field: "country", label: "Country" },
];

export default function PinCodes() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const {
    data: pincodes,
    nextToken,
    hasMore,
  } = useSelector((state) => state.pincodes);

  // ── Local state ───────────────────────────────────────────────────────────────
  const [operationLoading, setOperationLoading] = useState(false); // fetchMore / delete / edit
  const [modalLoading, setModalLoading] = useState(false); // import upload
  const [importedData, setImportedData] = useState([]);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedPincodes, setSelectedPincodes] = useState([]);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [currentEditData, setCurrentEditData] = useState(null);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(20);

  // ── DB search state ───────────────────────────────────────────────────────────
  // null  = no search active (show full Redux list)
  // array = search returned results (may be empty)
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────────
  // TanStack Query: initial pincodes fetch (same caching pattern as AllLeads)
  //
  // `enabled: pincodes.length === 0` prevents a re-fetch on every re-mount while
  // Redux still holds data.  After a bulk delete the caller clears Redux then
  // invalidates the query, which re-enables it for a fresh server round-trip.
  // ─────────────────────────────────────────────────────────────────────────────
  const { isLoading: pinsInitialLoading } = useQuery({
    queryKey: ["pincodes"],
    queryFn: async () => {
      const res = await fetch("/server/page_builder_function/pincode");
      const data = await res.json();
      if (!data.success) throw new Error("No pincodes found.");
      return data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: pincodes.length === 0,
  });

  // Read from the shared cache (enabled: false = never fetch, just observe).
  // When the first query above populates the cache this one gets the data too,
  // so the useEffect below can sync it into Redux.
  const { data: pinsQueryData } = useQuery({
    queryKey: ["pincodes"],
    enabled: false,
  });

  useEffect(() => {
    if (!pinsQueryData || pincodes.length > 0) return;
    dispatch(
      pincodeActions.setPincodes({
        data: pinsQueryData.data || [],
        nextToken: pinsQueryData.pagination?.next_token || null,
        hasMore: pinsQueryData.pagination?.more_records || false,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinsQueryData]);

  const loading = pinsInitialLoading || operationLoading || searchLoading;

  // ── DB search — fires only when exactly 6 digits are entered ─────────────────
  useEffect(() => {
    const trimmed = globalFilterValue.trim();

    // Empty box → back to full list, no message
    if (!trimmed) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }

    // Incomplete / invalid entry → clear previous results so hint message shows
    if (!/^\d{6}$/.test(trimmed)) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }

    // Exactly 6 digits → hit API immediately (no debounce needed)
    setSearchLoading(true);
    (async () => {
      try {
        const res = await fetch(
          `/server/page_builder_function/pincode/${encodeURIComponent(trimmed)}`,
        );
        const data = await res.json();
        // Normalise response shape
        const results = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : data?.data && typeof data.data === "object"
              ? [data.data]
              : [];
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    })();
  }, [globalFilterValue]);

  // ── Search / filter ───────────────────────────────────────────────────────────
  const searchTrimmed = globalFilterValue.trim();
  const isSearchTyped = searchTrimmed.length > 0;
  const isValidPincode = /^\d{6}$/.test(searchTrimmed);

  // Show full list only when the box is empty.
  // While typing (incomplete or invalid) show an empty table with a hint.
  // Once 6 digits are confirmed and results arrive, show those results.
  const filteredPincodes = !isSearchTyped
    ? pincodes // no input → full list
    : isValidPincode && searchResults !== null
      ? searchResults // 6-digit + results
      : []; // incomplete / loading

  // Disable token pagination whenever the user has typed anything
  const anyFilterActive = isSearchTyped;

  // Dynamic empty-state message
  const emptyMessage = !isSearchTyped
    ? "No pincodes found."
    : !isValidPincode
      ? "Please enter a complete 6-digit pincode to search."
      : searchResults !== null && searchResults.length === 0
        ? "No results found for this pincode."
        : "Please enter a complete 6-digit pincode to search.";

  const pageData = useMemo(
    () => filteredPincodes.slice(first, first + rows),
    [filteredPincodes, first, rows],
  );

  // +1 trick: keeps Next/Last buttons enabled on the last page when more data
  // exists on the server (token pagination).
  const totalRecords = anyFilterActive
    ? filteredPincodes.length
    : pincodes.length + (hasMore ? 1 : 0);

  // ── Fetch next token page ─────────────────────────────────────────────────────
  const fetchMorePincodes = async () => {
    if (!hasMore || !nextToken) return;
    setOperationLoading(true);
    try {
      const res = await fetch(
        `/server/page_builder_function/pincode?token=${nextToken}`,
      );
      const data = await res.json();
      if (data.success) {
        dispatch(
          pincodeActions.addPincodes({
            data: data.data || [],
            nextToken: data.pagination?.next_token || null,
            hasMore: data.pagination?.more_records || false,
          }),
        );
      }
    } catch {
      Swal.fire("Error", "Error fetching more pincodes.", "error");
    } finally {
      setOperationLoading(false);
    }
  };

  // ── Pagination handler ────────────────────────────────────────────────────────
  const onPageChange = useCallback(
    (event) => {
      const newPage = event.page;
      const sourceLen = anyFilterActive
        ? filteredPincodes.length
        : pincodes.length;
      const lastPage = Math.ceil(
        (sourceLen + (hasMore && !anyFilterActive ? 1 : 0)) / event.rows,
      );
      setFirst(event.first);
      setRows(event.rows);
      // Auto-fetch next token batch when the user reaches the last unfiltered page
      if (!anyFilterActive && hasMore && newPage + 1 === lastPage) {
        fetchMorePincodes();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [anyFilterActive, filteredPincodes.length, pincodes.length, hasMore],
  );

  const handleSearchChange = (value) => {
    setGlobalFilterValue(value);
    setFirst(0); // reset to page 1 on every search change
  };

  // ── File import ───────────────────────────────────────────────────────────────
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext === "csv") parseCSVFile(file);
    else if (["xls", "xlsx"].includes(ext)) parseExcelFile(file);
    else
      Swal.fire("Error", "Please upload a valid CSV or Excel file.", "error");
    event.target.value = null; // reset so same file can be re-uploaded
  };

  const parseCSVFile = (file) => {
    Papa.parse(file, {
      header: true,
      complete: (result) => {
        setImportedData(result.data.slice(0, 200));
        setShowPreviewDialog(true);
      },
      error: () => Swal.fire("Error", "Error parsing CSV file.", "error"),
    });
  };

  const parseExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(e.target.result, { type: "binary" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      setImportedData(XLSX.utils.sheet_to_json(sheet).slice(0, 200));
      setShowPreviewDialog(true);
    };
    reader.readAsBinaryString(file);
  };

  const validateImportedData = () => {
    const invalid = importedData.filter(
      (r) => !r.area_name || !r.pincode || !r.city || !r.state || !r.country,
    );
    if (invalid.length > 0) {
      Swal.fire(
        "Validation Error",
        "Please fill all fields in all rows before uploading.",
        "error",
      );
      return false;
    }
    return true;
  };

  const processImportedData = async () => {
    if (!validateImportedData()) return;
    setModalLoading(true);
    try {
      const response = await fetch("/server/page_builder_function/pincode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(importedData),
      });
      if (response.ok) {
        Swal.fire("Success", "Data uploaded successfully!", "success");
        setShowPreviewDialog(false);
        // Explicitly re-fetch and push straight into Redux so the table is
        // updated without going through the gated initial query (which can
        // otherwise leave the table momentarily empty).
        try {
          const fresh = await queryClient.fetchQuery({
            queryKey: ["pincodes"],
            queryFn: async () => {
              const r = await fetch("/server/page_builder_function/pincode");
              const d = await r.json();
              if (!d.success) throw new Error("No pincodes found.");
              return d;
            },
          });
          dispatch(
            pincodeActions.setPincodes({
              data: fresh.data || [],
              nextToken: fresh.pagination?.next_token || null,
              hasMore: fresh.pagination?.more_records || false,
            }),
          );
        } catch {
          // If refetch fails we leave Redux untouched — user can still see
          // the previously loaded list and refresh manually if needed.
        }
      } else {
        Swal.fire("Error", "Failed to upload data.", "error");
      }
    } catch {
      Swal.fire("Error", "Error uploading data.", "error");
    } finally {
      setModalLoading(false);
    }
  };

  const addRow = () =>
    setImportedData((prev) => [
      ...prev,
      { area_name: "", pincode: "", city: "", state: "", country: "" },
    ]);

  const removeRow = (index) =>
    setImportedData((prev) => prev.filter((_, i) => i !== index));

  // ── Edit ──────────────────────────────────────────────────────────────────────
  const handleEdit = useCallback((rowData) => {
    setCurrentEditData({ ...rowData });
    setEditDialogVisible(true);
  }, []);

  const saveEditedPincode = async () => {
    setOperationLoading(true);
    try {
      const response = await fetch(
        `/server/page_builder_function/pincode/${currentEditData.ROWID}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(currentEditData),
        },
      );
      if (response.ok) {
        Swal.fire("Success", "Pincode updated successfully!", "success");
        setEditDialogVisible(false);
        // Surgically replace just the edited row in Redux so the rest of the
        // already-loaded pincodes stay on screen (no flicker / no refresh needed).
        const updatedList = pincodes.map((p) =>
          p.ROWID === currentEditData.ROWID ? { ...p, ...currentEditData } : p,
        );
        dispatch(
          pincodeActions.setPincodes({
            data: updatedList,
            nextToken,
            hasMore,
          }),
        );
        // Also refresh the TanStack cache so navigating away/back shows the new value.
        queryClient.setQueryData(["pincodes"], (old) =>
          old
            ? {
                ...old,
                data: (old.data || []).map((p) =>
                  p.ROWID === currentEditData.ROWID
                    ? { ...p, ...currentEditData }
                    : p,
                ),
              }
            : old,
        );
      } else {
        Swal.fire("Error", "Failed to update pincode.", "error");
      }
    } catch {
      Swal.fire("Error", "Error updating pincode.", "error");
    } finally {
      setOperationLoading(false);
    }
  };

  // ── Bulk delete (batched, 200 at a time) ──────────────────────────────────────
  const handleDelete = () => {
    if (selectedPincodes.length === 0) {
      Swal.fire("Warning", "No pincodes selected for deletion.", "warning");
      return;
    }

    const batchSize = 200;
    const batches = [];
    for (let i = 0; i < selectedPincodes.length; i += batchSize) {
      batches.push(selectedPincodes.slice(i, i + batchSize));
    }

    Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete ${selectedPincodes.length} pincodes.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      setOperationLoading(true);

      let allDeleted = true;
      const allDeletedIds = []; // collect ALL deleted ROWIDs across batches

      for (const [index, batch] of batches.entries()) {
        try {
          const rowIds = batch.map((p) => p.ROWID);
          const res = await fetch("/server/page_builder_function/pincode", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rowIds }),
          });
          if (!res.ok) {
            Swal.fire("Error", `Error deleting batch ${index + 1}.`, "error");
            allDeleted = false;
            break;
          }
          allDeletedIds.push(...rowIds);
        } catch {
          Swal.fire("Error", `Error deleting batch ${index + 1}.`, "error");
          allDeleted = false;
          break;
        }
      }

      if (allDeleted) {
        // Optimistically remove from Redux
        dispatch(pincodeActions.deletePincodes(allDeletedIds));
        Swal.fire(
          "Success",
          `${selectedPincodes.length} pincodes deleted successfully!`,
          "success",
        );
        setSelectedPincodes([]);
      }

      setOperationLoading(false);
    });
  };

  // ── Column definitions ────────────────────────────────────────────────────────
  const columns = useMemo(
    () => [
      { field: "area_name", header: "Area Name", style: { minWidth: "200px" } },
      { field: "pincode", header: "Pincode", style: { minWidth: "120px" } },
      { field: "city", header: "City", style: { minWidth: "150px" } },
      { field: "state", header: "State", style: { minWidth: "150px" } },
      { field: "country", header: "Country", style: { minWidth: "150px" } },
      {
        header: "Actions",
        style: { minWidth: "80px" },
        body: (row) => (
          <button
            onClick={() => handleEdit(row)}
            title="Edit"
            style={{
              background: "none",
              border: "1px solid #2196f3",
              borderRadius: "5px",
              padding: "4px 9px",
              cursor: "pointer",
              color: "#2196f3",
              fontSize: "13px",
              lineHeight: 1,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#e3f2fd")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <i className="pi pi-pencil" />
          </button>
        ),
      },
    ],
    [handleEdit],
  );

  // ── ActionBar: Import button + Delete-selected button ────────────────────────
  const actionBar = (
    <div
      style={{
        display: "flex",
        gap: "10px",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      {/* Import CSV/Excel */}
      <button
        onClick={() => document.getElementById("pincode-file-input").click()}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          backgroundColor: "#3169be",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          padding: "8px 14px",
          fontSize: "13px",
          fontWeight: 600,
          cursor: "pointer",
          transition: "background 0.2s",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "#1f4a8c")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "#3169be")
        }
      >
        <i className="pi pi-upload" style={{ fontSize: "13px" }} />
        Import CSV/Excel
      </button>

      {/* Hidden file input */}
      <input
        type="file"
        accept=".csv, .xls, .xlsx"
        id="pincode-file-input"
        style={{ display: "none" }}
        onChange={handleFileUpload}
      />

      {/* Delete-selected: only shown when rows are checked */}
      {selectedPincodes.length > 0 && (
        <button
          onClick={handleDelete}
          title={`Delete ${selectedPincodes.length} selected pincode${
            selectedPincodes.length > 1 ? "s" : ""
          }`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            padding: "8px 12px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 0.2s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#dc2626")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#ef4444")
          }
        >
          <i className="pi pi-trash" style={{ fontSize: "13px" }} />
          Delete ({selectedPincodes.length})
        </button>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "20px", position: "relative" }}>
      {/* Full-screen loading overlay (initial fetch / operations) */}
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,255,255,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <PropagateLoader color="#3169BE" size={15} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          Main table
      ══════════════════════════════════════════════════════════════════ */}
      <CustomDataTable
        columns={columns}
        data={pageData}
        dataKey="ROWID"
        loading={false} // outer overlay handles this
        emptyMessage={emptyMessage}
        title="Pincodes"
        actionBar={actionBar}
        // Built-in search
        showSearch
        searchValue={globalFilterValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search area, pincode, city…"
        // Checkbox multi-select
        selectable
        selectedRows={selectedPincodes}
        onSelectionChange={setSelectedPincodes}
        // Token pagination (same +1 trick as Leads)
        first={first}
        rows={rows}
        totalRecords={totalRecords}
        onPageChange={onPageChange}
        rowsPerPageOptions={[5, 10, 20, 50]}
        hasMore={hasMore && !anyFilterActive}
      />

      {/* ══════════════════════════════════════════════════════════════════
          Edit Pincode Modal
      ══════════════════════════════════════════════════════════════════ */}
      <Modal
        title="Edit Pincode"
        open={editDialogVisible}
        onOk={saveEditedPincode}
        onCancel={() => setEditDialogVisible(false)}
        okText="Save"
        cancelText="Cancel"
        confirmLoading={operationLoading}
        okButtonProps={{
          style: { backgroundColor: "#3169be", borderColor: "#3169be" },
        }}
        width={450}
      >
        <div style={{ display: "grid", gap: "14px", padding: "8px 0" }}>
          {PINCODE_FIELDS.map(({ field, label }) => (
            <div key={field}>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#374151",
                }}
              >
                {label}
              </label>
              <input
                type="text"
                value={currentEditData?.[field] || ""}
                onChange={(e) =>
                  setCurrentEditData({
                    ...currentEditData,
                    [field]: e.target.value,
                  })
                }
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3169be";
                  e.target.style.boxShadow = "0 0 0 2px rgba(49, 105, 190,0.12)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#d1d5db";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
          ))}
        </div>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════
          Import Preview Modal
          Replaces PrimeReact DataTable with a plain editable HTML table.
          Each cell is an <input> — changes update importedData state.
      ══════════════════════════════════════════════════════════════════ */}
      <Modal
        title="Preview Imported Data"
        open={showPreviewDialog}
        onOk={processImportedData}
        onCancel={() => setShowPreviewDialog(false)}
        okText="Upload Data"
        cancelText="Cancel"
        confirmLoading={modalLoading}
        okButtonProps={{
          style: { backgroundColor: "#3169be", borderColor: "#3169be" },
        }}
        width="75vw"
        styles={{
          body: {
            padding: "16px",
            maxHeight: "65vh",
            overflowY: "auto",
          },
        }}
      >
        {modalLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "48px 0",
            }}
          >
            <PropagateLoader color="#3169BE" size={15} />
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "13px",
                  minWidth: "620px",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#f9fafb" }}>
                    {[...PINCODE_FIELDS.map((f) => f.label), ""].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 12px",
                          textAlign: "left",
                          borderBottom: "2px solid #e5e7eb",
                          fontWeight: 600,
                          color: "#374151",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importedData.map((row, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: "1px solid #f3f4f6",
                        backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa",
                      }}
                    >
                      {PINCODE_FIELDS.map(({ field }) => (
                        <td key={field} style={{ padding: "5px 8px" }}>
                          <input
                            type="text"
                            value={row[field] || ""}
                            onChange={(e) => {
                              const updated = [...importedData];
                              updated[idx] = {
                                ...updated[idx],
                                [field]: e.target.value,
                              };
                              setImportedData(updated);
                            }}
                            style={{
                              width: "100%",
                              padding: "5px 7px",
                              border: "1px solid #e5e7eb",
                              borderRadius: "4px",
                              fontSize: "12px",
                              outline: "none",
                              minWidth: "90px",
                              boxSizing: "border-box",
                              transition: "border-color 0.15s",
                            }}
                            onFocus={(e) =>
                              (e.target.style.borderColor = "#3169be")
                            }
                            onBlur={(e) =>
                              (e.target.style.borderColor = "#e5e7eb")
                            }
                          />
                        </td>
                      ))}

                      {/* Remove-row button */}
                      <td style={{ padding: "5px 8px" }}>
                        <button
                          onClick={() => removeRow(idx)}
                          title="Remove row"
                          style={{
                            background: "#fee2e2",
                            border: "none",
                            borderRadius: "4px",
                            padding: "4px 9px",
                            cursor: "pointer",
                            color: "#ef4444",
                            fontWeight: 700,
                            fontSize: "14px",
                            lineHeight: 1,
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#fecaca")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "#fee2e2")
                          }
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Row */}
            <button
              onClick={addRow}
              style={{
                marginTop: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                backgroundColor: "#f3f4f6",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "13px",
                cursor: "pointer",
                fontWeight: 500,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#e5e7eb")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#f3f4f6")
              }
            >
              <i className="pi pi-plus" style={{ fontSize: "12px" }} />
              Add Row
            </button>
          </>
        )}
      </Modal>
    </div>
  );
}
