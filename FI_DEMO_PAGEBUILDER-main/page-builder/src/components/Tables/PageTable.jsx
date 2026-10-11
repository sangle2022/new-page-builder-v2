import React, { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "react-toastify";
import { FaCheck, FaTimes, FaPencilAlt } from "react-icons/fa";
import { LuSquarePen, LuLink2, LuCopy, LuTrash2 } from "react-icons/lu";
import { HiMiniEye } from "react-icons/hi2";
import { PropagateLoader } from "react-spinners";
import "primeicons/primeicons.css";
import { Form, Input, Modal, Spin, Tooltip } from "antd";
import axios from "axios";
import RestorePageIcon from "@mui/icons-material/RestorePage";
import CustomDataTable from "../../components/CustomDataTable"; // adjust path as needed

// ─── Pure helper: format Zoho timestamp ───────────────────────────────────────
function formatDateTime(value) {
  if (!value) return "—";
  const normalized = value.replace(
    /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}):(\d{3})$/,
    "$1T$2.$3",
  );
  const date = new Date(normalized);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

// ─── Status badge colours ─────────────────────────────────────────────────────
function statusColor(status) {
  switch ((status || "").toLowerCase()) {
    case "published":
      return "#4caf50";
    case "draft":
      return "#ff9999";
    default:
      return "orange";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
export default function PageTable({
  pages, // already tab-filtered by AllPages
  globalFilterValue,
  onGlobalFilterChange,
  viewPage,
  editPage,
  confirmDeletePage,
  fetchPage,
  headerContent, // tab buttons passed from AllPages → goes into CustomDataTable toolbar
  hasMore = false, // token pagination: more pages exist on the server
  onFetchMore, // callback → AllPages fetches the next token batch
  dataLoading = false, // true while AllPages is fetching (prevents spurious page-1 resets)
}) {
  // ── Search-filtered pages ──────────────────────────────────────────────────
  const [filteredPages, setFilteredPages] = useState(pages);

  // ── Inline editing state ───────────────────────────────────────────────────
  const [editingPageName, setEditingPageName] = useState(null); // rowData | null
  const [temporaryPageName, setTemporaryPageName] = useState("");
  const [editingStatus, setEditingStatus] = useState(null); // rowData | null

  // ── Page-load overlay (shown while fetching HTML for editor) ───────────────
  const [isEditing, setIsEditing] = useState(false);

  // ── Clone modal ────────────────────────────────────────────────────────────
  const [isCloneModalVisible, setIsCloneModalVisible] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState(null);
  const [cloneLoading, setCloneLoading] = useState(false);
  const [pageName, setPageName] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [slugLoading, setSlugLoading] = useState(false);
  const [isSlugUnique, setIsSlugUnique] = useState(true);

  // ── UTM link modal ─────────────────────────────────────────────────────────
  const [copylinkModal, setCopylinkModal] = useState(false);
  const [utm, setUtm] = useState({
    source: "",
    medium: "",
    campaign: "",
    term: "",
    content: "",
  });
  const [link, setLink] = useState("");

  // ── Pagination state ───────────────────────────────────────────────────────
  const [tableFirst, setTableFirst] = useState(0);
  const [tableRows, setTableRows] = useState(20);

  // ── Re-filter whenever search value or source pages change ────────────────
  //    NOTE: no pagination reset here — handled by the two effects below.
  useEffect(() => {
    if (!globalFilterValue) {
      setFilteredPages(pages);
    } else {
      const lower = globalFilterValue.toLowerCase();
      setFilteredPages(
        pages.filter(
          (p) =>
            p.PageName.toLowerCase().includes(lower) ||
            p.Status.toLowerCase().includes(lower) ||
            (p.CREATEDTIME || "").toLowerCase().includes(lower) ||
            (p.MODIFIEDTIME || "").toLowerCase().includes(lower),
        ),
      );
    }
  }, [globalFilterValue, pages]);

  // ── Reset to page 1 ONLY when the search query text changes ───────────────
  //    Fires on every search keystroke, but NOT on data refreshes (status/name
  //    updates), so the user stays on their current page after inline edits.
  useEffect(() => {
    setTableFirst(0);
  }, [globalFilterValue]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (dataLoading) return; // ← don't reset during loading
    if (filteredPages.length === 0) return; // ← don't reset on transient empty
    const lastValidFirst =
      Math.floor((filteredPages.length - 1) / tableRows) * tableRows;
    if (tableFirst > lastValidFirst) setTableFirst(lastValidFirst);
  }, [filteredPages, tableRows, dataLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── UTM link: rebuild whenever utm fields or slug change ──────────────────
  useEffect(() => {
    setLink(
      `${window.location.origin}/#/${slug}?utm_source=${utm.source}&utm_medium=${utm.medium}&utm_campaign=${utm.campaign}&utm_term=${utm.term}&utm_content=${utm.content}`,
    );
  }, [utm, slug]);

  useEffect(() => {
    // Only run when the clone modal is open and a slug value exists
    if (!isCloneModalVisible || !slug) {
      setSlugLoading(false);
      setIsSlugUnique(true); // treat empty slug as "no error yet"
      return;
    }

    // Show spinner immediately so the user knows a check is in progress
    setSlugLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/server/page_builder_function/verify-slug?slug=${encodeURIComponent(slug)}`,
        );
        const data = await res.json();
        setIsSlugUnique(!!data.isUnique);
      } catch {
        // Network error — treat as unknown; let the user proceed and catch at submit
        setIsSlugUnique(false);
      } finally {
        setSlugLoading(false);
      }
    }, 500); // 500 ms debounce

    // Cancel the pending call if slug changes before the timeout fires
    return () => clearTimeout(timer);
  }, [slug, isCloneModalVisible]);

  // ─── Helper: reset clone form ───────────────────────────────────────────────
  const resetCloneForm = useCallback(() => {
    setPageName("");
    setPageTitle("");
    setSlug("");
    setIsSlugManuallyEdited(false);
    setIsSlugUnique(true); // reset to "no error" — empty slug shows no indicator anyway
    setSlugLoading(false);
  }, []);

  const isAnyUtmEmpty = () =>
    !utm.source.trim() ||
    !utm.medium.trim() ||
    !utm.campaign.trim() ||
    !utm.term.trim() ||
    !utm.content.trim();

  const copyPageLink = () => {
    navigator.clipboard.writeText(link);
    toast.success("Page Link Copied!");
  };

  // ─── Open clone modal ───────────────────────────────────────────────────────
  const openCloneModal = useCallback(
    (rowData) => {
      setSelectedRowData(rowData);
      resetCloneForm();
      setIsCloneModalVisible(true);
    },
    [resetCloneForm],
  );

  // ─── API: Clone page ────────────────────────────────────────────────────────
  const handleClonePage = async () => {
    // Verify slug uniqueness first
    try {
      const res = await fetch(
        `/server/page_builder_function/verify-slug?slug=${encodeURIComponent(slug)}`,
      );
      const data = await res.json();
      if (!data.isUnique) {
        toast.error("Slug already exists. Please choose a different one.");
        return;
      }
    } catch {
      toast.error("Could not verify slug uniqueness.");
      return;
    }

    try {
      setCloneLoading(true);
      const response = await axios.post(
        `/server/page_builder_function/clone/page/${selectedRowData.ROWID}`,
        { status: "Draft", pageName, pageSlug: slug, pageTitle },
      );
      if (response.status === 200) {
        toast.success("Page cloned successfully!");
        resetCloneForm();
        setIsCloneModalVisible(false);
        fetchPage();
      } else {
        toast.error(response.data?.message || "Failed to clone the page.");
      }
    } catch {
      toast.error("Slug already exists. Please choose a different one.");
    } finally {
      setCloneLoading(false);
    }
  };

  // ─── API: Update status (fires immediately on dropdown change) ──────────────
  const handleStatusChange = useCallback(
    async (newStatus, rowData) => {
      try {
        const response = await fetch(
          `/server/page_builder_function/update/page/${rowData.ROWID}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          },
        );
        if (response.ok) {
          toast.success("Page status updated successfully!");
          // Mutate in-place so the table reflects the change instantly
          rowData.Status = newStatus;
          setEditingStatus(null);
          // Trigger re-filter so the tab view stays consistent
          fetchPage();
        } else {
          toast.error("Failed to update page status.");
        }
      } catch {
        toast.error("An error occurred while updating the status.");
      }
    },
    [fetchPage],
  );

  // ─── API: Update page name ──────────────────────────────────────────────────
  const handlePageNameChange = useCallback(
    async (newName, rowData) => {
      if (!newName.trim()) return;
      try {
        const response = await fetch(
          `/server/page_builder_function/update/page/${rowData.ROWID}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pageName: newName }),
          },
        );
        if (response.ok) {
          toast.success("Page name updated successfully!");
          rowData.pageName = newName;
          setEditingPageName(null);
          setTemporaryPageName("");
          fetchPage();
        } else {
          toast.error("Failed to update page name.");
        }
      } catch {
        toast.error("An error occurred while updating the page name.");
      }
    },
    [fetchPage],
  );

  // ─── Navigate to editor ────────────────────────────────────────────────────
  const handleEdit = useCallback(
    async (rowData) => {
      setIsEditing(true);
      try {
        await editPage(rowData);
      } finally {
        setIsEditing(false);
      }
    },
    [editPage],
  );

  // ════════════════════════════════════════════════════════════════════════════
  // Column body renderers
  // Each is a useCallback so columns useMemo only rebuilds when its deps change
  // ════════════════════════════════════════════════════════════════════════════

  // ── Page Name: click pencil or text → inline input → ✓ / ✕ ───────────────
  const pageNameBody = useCallback(
    (rowData) => {
      const isEditing = editingPageName?.ROWID === rowData.ROWID;

      return isEditing ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            width: "100%",
          }}
        >
          <input
            type="text"
            autoFocus
            value={temporaryPageName}
            onChange={(e) => setTemporaryPageName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                handlePageNameChange(temporaryPageName, rowData);
              if (e.key === "Escape") {
                setEditingPageName(null);
                setTemporaryPageName("");
              }
            }}
            style={{
              flex: 1,
              border: "1px solid #3169be",
              borderRadius: "5px",
              padding: "4px 8px",
              fontSize: "13px",
              outline: "none",
              boxShadow: "0 0 0 2px rgba(49, 105, 190,0.15)",
              minWidth: 0,
            }}
          />
          <FaCheck
            onClick={() => handlePageNameChange(temporaryPageName, rowData)}
            style={{
              cursor: "pointer",
              color: "#4caf50",
              fontSize: "15px",
              flexShrink: 0,
            }}
            title="Save (Enter)"
          />
          <FaTimes
            onClick={() => {
              setEditingPageName(null);
              setTemporaryPageName("");
            }}
            style={{
              cursor: "pointer",
              color: "#f44336",
              fontSize: "15px",
              flexShrink: 0,
            }}
            title="Cancel (Esc)"
          />
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            cursor: "pointer",
          }}
        >
          <FaPencilAlt
            title="Edit name"
            onClick={() => {
              setEditingPageName(rowData);
              setTemporaryPageName(rowData.PageName);
            }}
            style={{ fontSize: "13px", color: "#1890ff", flexShrink: 0 }}
          />
          <span
            style={{ color: "#1890ff" }}
            onClick={() => {
              setEditingPageName(rowData);
              setTemporaryPageName(rowData.PageName);
            }}
          >
            {rowData.PageName}
          </span>
        </div>
      );
    },
    [editingPageName, temporaryPageName, handlePageNameChange],
  );

  // ── Status: click badge → native select → change fires PUT immediately ─────
  const statusBody = useCallback(
    (rowData) => {
      const isEditingThis = editingStatus?.ROWID === rowData.ROWID;
      const bg = statusColor(rowData.Status || "");

      return isEditingThis ? (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <select
            autoFocus
            defaultValue={rowData.Status}
            onChange={(e) => handleStatusChange(e.target.value, rowData)}
            style={{
              border: "1px solid #3169be",
              borderRadius: "5px",
              padding: "5px 8px",
              fontSize: "13px",
              cursor: "pointer",
              outline: "none",
              color: "#374151",
              boxShadow: "0 0 0 2px rgba(49, 105, 190,0.15)",
            }}
          >
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
          </select>
          <FaTimes
            onClick={() => setEditingStatus(null)}
            style={{ cursor: "pointer", color: "#f44336", fontSize: "15px" }}
            title="Cancel"
          />
        </div>
      ) : (
        <span
          onClick={() => setEditingStatus(rowData)}
          title={
            (rowData.Status || "").toLowerCase() === "deleted"
              ? "Restore Page"
              : "Click to change status"
          }
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "4px 10px",
            borderRadius: "5px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            background: bg,
            color: "#fff",
            userSelect: "none",
            whiteSpace: "nowrap",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          {rowData.Status || "—"}
          <RestorePageIcon style={{ fontSize: "14px" }} />
        </span>
      );
    },
    [editingStatus, handleStatusChange],
  );

  // ── Actions: View | Edit | CopyLink | Clone | Delete ──────────────────────
  const actionsBody = useCallback(
    (rowData) => {
      const deleted = (rowData.Status || "").toLowerCase() === "deleted";
      const draft = (rowData.Status || "").toLowerCase() === "draft";

      const buttons = [
        {
          key: "view",
          title: deleted || draft ? "Not available" : "View Page",
          icon: <HiMiniEye style={{ fontSize: 14 }} />,
          disabled: deleted || draft,
          onClick: () => viewPage(rowData),
          gradient: "linear-gradient(135deg, #22c55e, #16a34a)",
          shadow: "0 4px 12px rgba(34,197,94,0.4)",
          hoverShadow: "0 6px 16px rgba(22,163,74,0.55)",
        },
        {
          key: "edit",
          title: deleted ? "Not available" : "Edit Page",
          icon: <LuSquarePen style={{ fontSize: 14, strokeWidth: 2 }} />,
          disabled: deleted,
          onClick: () => handleEdit(rowData),
          gradient: "linear-gradient(135deg, #3b82f6, #2563eb)",
          shadow: "0 4px 12px rgba(59,130,246,0.4)",
          hoverShadow: "0 6px 16px rgba(37,99,235,0.55)",
        },
        {
          key: "copy",
          title: deleted ? "Not available" : "Copy Page Link",
          icon: <LuLink2 style={{ fontSize: 14, strokeWidth: 2 }} />,
          disabled: deleted,
          onClick: () => {
            setCopylinkModal(true);
            setSlug(rowData.pageSlug);
          },
          gradient: "linear-gradient(135deg, #4889ec, #276edb)",
          shadow: "0 4px 12px rgba(236,72,153,0.4)",
          hoverShadow: "0 6px 16px rgba(219,39,119,0.55)",
        },
        {
          key: "clone",
          title: deleted ? "Not available" : "Clone Page",
          icon: <LuCopy style={{ fontSize: 14, strokeWidth: 2 }} />,
          disabled: deleted,
          onClick: () => openCloneModal(rowData),
          gradient: "linear-gradient(135deg, #f59e0b, #f97316)",
          shadow: "0 4px 12px rgba(245,158,11,0.4)",
          hoverShadow: "0 6px 16px rgba(249,115,22,0.55)",
        },
        {
          key: "delete",
          title: "Delete",
          icon: <LuTrash2 style={{ fontSize: 14, strokeWidth: 2 }} />,
          disabled: false,
          onClick: () => confirmDeletePage(rowData),
          gradient: "linear-gradient(135deg, #ef4444, #dc2626)",
          shadow: "0 4px 12px rgba(239,68,68,0.4)",
          hoverShadow: "0 6px 16px rgba(220,38,38,0.55)",
        },
      ];

      const DISABLED_BG = "linear-gradient(135deg, #d1d5db, #9ca3af)";
      const DISABLED_SHADOW = "0 2px 6px rgba(156,163,175,0.3)";

      return (
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {buttons.map(
            ({
              key,
              title,
              icon,
              disabled,
              onClick,
              gradient,
              shadow,
              hoverShadow,
            }) => (
              <Tooltip
                key={key}
                title={title}
                placement="top"
                mouseEnterDelay={0}
              >
                <button
                  onClick={() => !disabled && onClick()}
                  onMouseEnter={(e) => {
                    if (disabled) return;
                    e.currentTarget.style.transform =
                      "translateY(-2px) scale(1.08)";
                    e.currentTarget.style.boxShadow = hoverShadow;
                  }}
                  onMouseLeave={(e) => {
                    if (disabled) return;
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow = shadow;
                  }}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    border: "none",
                    background: disabled ? DISABLED_BG : gradient,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: disabled ? "not-allowed" : "pointer",
                    boxShadow: disabled ? DISABLED_SHADOW : shadow,
                    transition: "transform 0.18s ease, box-shadow 0.18s ease",
                    flexShrink: 0,
                    opacity: disabled ? 0.6 : 1,
                  }}
                >
                  {icon}
                </button>
              </Tooltip>
            ),
          )}
        </div>
      );
    },
    [viewPage, handleEdit, openCloneModal, confirmDeletePage],
  );

  // ════════════════════════════════════════════════════════════════════════════
  // Column definitions
  // Rebuilt only when a body-renderer callback changes
  // ════════════════════════════════════════════════════════════════════════════
  const columns = useMemo(
    () => [
      {
        header: "Page Name",
        body: pageNameBody,
        style: { minWidth: "220px" },
      },
      {
        header: "Status",
        body: statusBody,
        style: { minWidth: "140px" },
      },
      {
        header: "Created Time",
        body: (row) => formatDateTime(row.CREATEDTIME),
        style: { minWidth: "170px" },
      },
      {
        header: "Modified Time",
        body: (row) => formatDateTime(row.MODIFIEDTIME),
        style: { minWidth: "170px" },
      },
      {
        field: "CreatedBy",
        header: "Created By",
        style: { minWidth: "140px" },
      },
      {
        header: "Total Visits",
        body: (row) => {
          const count = row.View_Count || 0;
          return (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "3px 10px",
                borderRadius: "999px",
                background: "#f2f6fd",
                border: "1px solid #d2e1f8",
                color: "#3169be",
                fontWeight: 600,
                fontSize: "12px",
                lineHeight: 1.4,
                minWidth: "34px",
                justifyContent: "center",
              }}
            >
              {count}
            </span>
          );
        },
        style: { minWidth: "100px", textAlign: "center" },
      },
      {
        header: "Actions",
        body: actionsBody,
        style: { minWidth: "210px" },
      },
    ],
    [pageNameBody, statusBody, actionsBody],
  );

  // ── Paginated slice ────────────────────────────────────────────────────────
  const pageData = useMemo(
    () => filteredPages.slice(tableFirst, tableFirst + tableRows),
    [filteredPages, tableFirst, tableRows],
  );

  const onPageChange = useCallback(
    ({ first, rows, page }) => {
      setTableFirst(first);
      setTableRows(rows);
      // When the server has more pages and the user reaches the last locally-held
      // page, fire the load-more callback so AllPages fetches the next token batch.
      if (hasMore && onFetchMore) {
        const lastPage = Math.ceil((filteredPages.length + 1) / rows);
        if (page + 1 >= lastPage) onFetchMore();
      }
    },
    [hasMore, onFetchMore, filteredPages.length],
  );

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: "relative" }}>
      {/* ── Full-screen overlay while loading page HTML for editor ── */}
      {isEditing && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,255,255,0.75)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            borderRadius: "12px",
          }}
        >
          <PropagateLoader color="#3169be" size={15} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          CustomDataTable
          • headerContent  = tab buttons (passed in from AllPages)
          • showSearch     = built-in keyword search
          • No selectable  (pages table doesn't have multi-select)
          • No hasMore     (all pages are fetched at once)
      ══════════════════════════════════════════════════════════════ */}
      <CustomDataTable
        columns={columns}
        data={pageData}
        dataKey="ROWID"
        loading={false}
        emptyMessage="No pages found."
        // Toolbar
        headerContent={headerContent}
        // Search
        showSearch
        searchValue={globalFilterValue}
        onSearchChange={(val) =>
          onGlobalFilterChange({ target: { value: val } })
        }
        searchPlaceholder="Search by keyword"
        // Pagination — totalRecords gets +1 when more server pages exist
        // so the Next arrow stays enabled (same trick used in Leads/Pincodes).
        first={tableFirst}
        rows={tableRows}
        totalRecords={filteredPages.length + (hasMore ? 1 : 0)}
        onPageChange={onPageChange}
        rowsPerPageOptions={[5, 10, 20, 50]}
        hasMore={hasMore}
      />

      {/* ══════════════════════════════════════════════════════════════
          Clone Modal
      ══════════════════════════════════════════════════════════════ */}
      <Modal
        title="Enter Page Details"
        open={isCloneModalVisible}
        onOk={handleClonePage}
        onCancel={() => {
          setIsCloneModalVisible(false);
          resetCloneForm();
        }}
        okText="Clone Page"
        cancelText="Cancel"
        confirmLoading={cloneLoading}
        okButtonProps={(() => {
          const isDisabled =
            !pageName || !pageTitle || !slug || slugLoading || !isSlugUnique;
          return {
            disabled: isDisabled,
            // Apply brand colour only when enabled; when disabled, let Ant Design
            // render its standard grey so the button text remains readable.
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
                // allow only lowercase letters, numbers, and hyphens
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

      {/* ══════════════════════════════════════════════════════════════
          UTM / Copy Link Modal
      ══════════════════════════════════════════════════════════════ */}
      <Modal
        title="Add UTM Parameters"
        open={copylinkModal}
        onCancel={() => {
          setCopylinkModal(false);
          setUtm({
            source: "",
            medium: "",
            campaign: "",
            term: "",
            content: "",
          });
          setLink("");
        }}
        footer={null}
        width={660}
        styles={{ body: { padding: 0 } }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            padding: "16px",
            backgroundColor: "#f3f7fd",
            borderRadius: "0 0 8px 8px",
          }}
        >
          {/* Input grid: 2 columns */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            {[
              { id: "source", label: "UTM Source", value: utm.source },
              { id: "medium", label: "UTM Medium", value: utm.medium },
              { id: "campaign", label: "UTM Campaign", value: utm.campaign },
              { id: "term", label: "UTM Term", value: utm.term },
            ].map((f) => (
              <div key={f.id}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 500,
                    fontSize: "13px",
                    marginBottom: "4px",
                    color: "#374151",
                  }}
                >
                  {f.label}
                </label>
                <input
                  type="text"
                  value={f.value}
                  onChange={(e) => setUtm({ ...utm, [f.id]: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #3169be",
                    backgroundColor: "#fff",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            ))}

            {/* UTM Content — full width */}
            <div style={{ gridColumn: "span 2" }}>
              <label
                style={{
                  display: "block",
                  fontWeight: 500,
                  fontSize: "13px",
                  marginBottom: "4px",
                  color: "#374151",
                }}
              >
                UTM Content
              </label>
              <input
                type="text"
                value={utm.content}
                onChange={(e) => setUtm({ ...utm, content: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #3169be",
                  backgroundColor: "#fff",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Generated link preview + copy button */}
          <div>
            <h4 style={{ marginBottom: "8px", color: "#3169be" }}>
              Generated Link
            </h4>
            <div
              style={{
                background: "#fff",
                padding: "10px 12px",
                borderRadius: "4px",
                border: "1px solid #3169be",
                fontSize: "12px",
                wordBreak: "break-all",
                marginBottom: "12px",
                color: "#374151",
                lineHeight: 1.6,
                minHeight: "38px",
              }}
            >
              {link || (
                <span style={{ color: "#9ca3af" }}>
                  Fill in all UTM fields to generate the link
                </span>
              )}
            </div>

            <button
              onClick={copyPageLink}
              disabled={isAnyUtmEmpty()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: isAnyUtmEmpty() ? "#d1d5db" : "#3169be",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: isAnyUtmEmpty() ? "not-allowed" : "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!isAnyUtmEmpty())
                  e.currentTarget.style.backgroundColor = "#1f4a8c";
              }}
              onMouseLeave={(e) => {
                if (!isAnyUtmEmpty())
                  e.currentTarget.style.backgroundColor = "#3169be";
              }}
            >
              <i className="pi pi-copy" style={{ fontSize: "13px" }} />
              Copy URL
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
