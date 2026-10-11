import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { HiMiniEye } from "react-icons/hi2";
import { LuTrash2 } from "react-icons/lu";
import { Modal, Select, Tooltip } from "antd";
import Swal from "sweetalert2";
import "primeicons/primeicons.css";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import { leadActions } from "../../store/leadSlice";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CustomDataTable from "../../components/CustomDataTable";

// ─── Normalise a raw lead record from the API ─────────────────────────────────
const normaliseLead = (lead) => {
  const parsed = lead.Lead_data ? JSON.parse(lead.Lead_data) : {};
  return { ...lead, Lead_data: parsed, pageId: parsed.pageId || null };
};

// ─── Dynamic field finder ─────────────────────────────────────────────────────
// Scans Lead_data for a value using two strategies:
//   1. Exact key match  — checks a priority list of known key names first
//   2. Fuzzy keyword match — finds the first key whose lowercased text
//      contains ALL of the supplied keywords (handles any future field name)
const findField = (data, keywords, knownKeys = []) => {
  if (!data) return null;
  // Priority 1: exact known keys (order matters — most specific first)
  for (const key of knownKeys) {
    if (data[key] != null && data[key] !== "") return data[key];
  }
  // Priority 2: fuzzy match — all keywords must appear in the key name
  const hit = Object.entries(data).find(([key]) =>
    keywords.every((kw) => key.toLowerCase().includes(kw.toLowerCase())),
  );
  return hit?.[1] ?? null;
};

export default function AllLeads() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const {
    data: leads,
    nextToken,
    hasMore,
  } = useSelector((state) => state.leads);

  // ── Local state ──────────────────────────────────────────────────────────────
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(20);
  const [operationLoading, setOperationLoading] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewingLead, setViewingLead] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);

  // ── Shared pages list (used by both dropdown filter and export modal) ─────────
  const [allPagesList, setAllPagesList] = useState([]);
  const [pagesListNextToken, setPagesListNextToken] = useState(null);
  const [pagesListHasMore, setPagesListHasMore] = useState(false);
  const [pagesListLoading, setPagesListLoading] = useState(false);

  // ── Page-filter state (API-driven, offset-paginated) ─────────────────────────
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [pageFilteredLeads, setPageFilteredLeads] = useState([]);
  const [pageFilterOffset, setPageFilterOffset] = useState(0);
  const [pageFilterHasMore, setPageFilterHasMore] = useState(false);
  const [pageFilterLoading, setPageFilterLoading] = useState(false);

  // ── Export modal state ───────────────────────────────────────────────────────
  const [exportSearchQuery, setExportSearchQuery] = useState("");
  const [exportSearchResults, setExportSearchResults] = useState(null);
  const [exportSearchLoading, setExportSearchLoading] = useState(false);
  const [exportingPage, setExportingPage] = useState(null);
  const [exportJobStatus, setExportJobStatus] = useState(null);
  const [exportJobMessage, setExportJobMessage] = useState("");
  const pollingRef = useRef(null);
  const exportAbortRef = useRef(null);
  const exportCancelledRef = useRef(false);

  // ── Other filter state (pincode, area — unchanged) ───────────────────────────
  const [filters, setFilters] = useState({
    area_name: { value: null },
    pincode: { value: null },
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TanStack Query: initial leads fetch
  // ─────────────────────────────────────────────────────────────────────────────
  const { isLoading: leadsInitialLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const res = await axios.get("/server/page_builder_function/leads_live");
      if (!res.data.success) throw new Error("Failed to fetch leads");
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: leads.length === 0,
    onSuccess: (data) => {
      dispatch(
        leadActions.setLeads({
          data: data.data.map(normaliseLead),
          nextToken: data.pagination?.next_token || null,
          hasMore: data.pagination?.more_records || false,
        }),
      );
    },
  });

  // Fallback sync for TanStack v5
  const { data: leadsQueryData } = useQuery({
    queryKey: ["leads"],
    enabled: false,
  });

  useEffect(() => {
    if (!leadsQueryData || leads.length > 0) return;
    dispatch(
      leadActions.setLeads({
        data: leadsQueryData.data.map(normaliseLead),
        nextToken: leadsQueryData.pagination?.next_token || null,
        hasMore: leadsQueryData.pagination?.more_records || false,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadsQueryData]);

  // ── TanStack Query: pages (all-pages API, cached, shared by dropdown + export) ─
  const { data: allPagesQueryData, isLoading: allPagesInitialLoading } =
    useQuery({
      queryKey: ["all-pages"],
      queryFn: async () => {
        const res = await axios.get("/server/page_builder_function/all-pages");
        if (!res.data.success) throw new Error("Failed to fetch pages");
        return res.data;
      },
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    });

  // Sync pages cache → local list (guard prevents overwriting accumulated batches)
  useEffect(() => {
    if (!allPagesQueryData || allPagesList.length > 0) return;
    const batch = (allPagesQueryData.data || []).filter(
      (p) => (p.Status || "").toLowerCase() !== "deleted",
    );
    setAllPagesList(batch);
    setPagesListNextToken(allPagesQueryData.pagination?.next_token || null);
    setPagesListHasMore(allPagesQueryData.pagination?.more_records || false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPagesQueryData]);

  // id → PageName map (used by table "Page Name" column and view-lead panel)
  const pages = useMemo(
    () =>
      allPagesList.reduce((acc, p) => {
        acc[p.ROWID] = p.PageName;
        return acc;
      }, {}),
    [allPagesList],
  );

  // ── Fetch next token batch of pages (shared: dropdown "Show More" + export modal) ─
  const fetchMorePagesList = async () => {
    if (!pagesListHasMore || !pagesListNextToken || pagesListLoading) return;
    setPagesListLoading(true);
    try {
      const res = await axios.get("/server/page_builder_function/all-pages", {
        params: { token: pagesListNextToken },
      });
      const data = res.data;
      if (data.success) {
        const batch = (data.data || []).filter(
          (p) => (p.Status || "").toLowerCase() !== "deleted",
        );
        setAllPagesList((prev) => {
          const updated = [...prev, ...batch];
          // Keep TanStack cache in sync so navigating away/back restores all batches
          queryClient.setQueryData(["all-pages"], {
            ...data,
            data: updated,
          });
          return updated;
        });
        setPagesListNextToken(data.pagination?.next_token || null);
        setPagesListHasMore(data.pagination?.more_records || false);
      }
    } catch (err) {
      console.error("Error fetching more pages:", err);
    } finally {
      setPagesListLoading(false);
    }
  };

  // ── Fetch leads by page (offset-paginated) ────────────────────────────────────
  const fetchLeadsByPage = async (pageId, offset = 0) => {
    setPageFilterLoading(true);
    try {
      const res = await axios.get(
        "/server/page_builder_function/getLeadsByPageId",
        {
          params: { pageId, limit: 100, offset },
        },
      );
      const data = res.data;
      // API returns { data: [{ Leads: {...} }, ...], count, hasMore }
      const newLeads = (data.data || []).map((item) =>
        normaliseLead(item.Leads || item),
      );
      setPageFilteredLeads((prev) =>
        offset === 0 ? newLeads : [...prev, ...newLeads],
      );
      setPageFilterOffset(offset + newLeads.length);
      setPageFilterHasMore(data.hasMore || false);
    } catch (err) {
      console.error("Error fetching leads by page:", err);
    } finally {
      setPageFilterLoading(false);
    }
  };

  // ── Page filter dropdown handler ──────────────────────────────────────────────
  const handlePageFilterChange = (pageId) => {
    const val = pageId || null;
    setSelectedPageId(val);
    setFirst(0);
    if (!val) {
      setPageFilteredLeads([]);
      setPageFilterOffset(0);
      setPageFilterHasMore(false);
      return;
    }
    fetchLeadsByPage(val, 0);
  };

  // ── Combined loading flag ─────────────────────────────────────────────────────
  const loading = leadsInitialLoading || operationLoading || pageFilterLoading;

  // ── Any OTHER filter active (pincode / area — not page filter) ────────────────
  const anyFilterActive = !!(
    filters.area_name?.value || filters.pincode?.value
  );

  // ── Client-side filter (pincode / area only, applied on Redux leads) ──────────
  const filteredLeads = useMemo(() => {
    let arr = leads || [];

    if (filters.pincode?.value) {
      arr = arr.filter(
        (l) =>
          String(l.Lead_data?.pincode || "") === String(filters.pincode.value),
      );
    }
    if (filters.area_name?.value) {
      const a = String(filters.area_name.value).toLowerCase();
      arr = arr.filter((l) =>
        String(l.Lead_data?.area_name || "")
          .toLowerCase()
          .startsWith(a),
      );
    }
    return arr;
  }, [leads, filters]);

  // ── Effective data source: page-filtered API results OR Redux leads ───────────
  const effectiveLeads = selectedPageId ? pageFilteredLeads : filteredLeads;
  const effectiveHasMore = selectedPageId
    ? pageFilterHasMore
    : hasMore && !anyFilterActive;

  // ── Paginated slice ───────────────────────────────────────────────────────────
  const pageData = useMemo(
    () => effectiveLeads.slice(first, first + rows),
    [effectiveLeads, first, rows],
  );

  // ── Total records (+1 trick keeps "Next" enabled for token/offset pagination) ──
  const totalRecords = selectedPageId
    ? pageFilteredLeads.length + (pageFilterHasMore ? 1 : 0)
    : anyFilterActive
      ? filteredLeads.length
      : leads.length + (hasMore ? 1 : 0);

  // ── Fetch next batch ──────────────────────────────────────────────────────────
  const fetchMoreLeads = async () => {
    if (!hasMore || !nextToken) return;
    setOperationLoading(true);
    try {
      const res = await axios.get("/server/page_builder_function/leads_live", {
        params: { token: nextToken },
      });
      if (res.data.success) {
        dispatch(
          leadActions.addLeads({
            data: res.data.data.map(normaliseLead),
            nextToken: res.data.pagination?.next_token || null,
            hasMore: res.data.pagination?.more_records || false,
          }),
        );
      }
    } catch (err) {
      console.error("Error fetching more leads:", err);
    } finally {
      setOperationLoading(false);
    }
  };

  // ── Pagination handler ────────────────────────────────────────────────────────
  const onPageChange = (event) => {
    const newPage = event.page;
    setFirst(event.first);
    setRows(event.rows);

    if (selectedPageId) {
      // Offset-based pagination for page-filtered leads
      const lastPage = Math.ceil(
        (pageFilteredLeads.length + (pageFilterHasMore ? 1 : 0)) / event.rows,
      );
      if (pageFilterHasMore && newPage + 1 === lastPage) {
        fetchLeadsByPage(selectedPageId, pageFilterOffset);
      }
      return;
    }

    // Token-based pagination for all leads
    const sourceLen = anyFilterActive ? filteredLeads.length : leads.length;
    const lastPage = Math.ceil(
      (sourceLen + (hasMore && !anyFilterActive ? 1 : 0)) / event.rows,
    );
    if (!anyFilterActive && hasMore && newPage + 1 === lastPage) {
      fetchMoreLeads();
    }
  };

  // ── Polling cleanup on unmount ────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // ── Cancel any in-flight export immediately ─────────────────────────────────
  const handleCancelExport = () => {
    exportCancelledRef.current = true;
    stopPolling();
    if (exportAbortRef.current) {
      try {
        exportAbortRef.current.abort();
      } catch (_) {}
      exportAbortRef.current = null;
    }
    setExportingPage(null);
    setExportJobStatus(null);
    setExportJobMessage("");
  };

  // ── Export modal — debounced page search ──────────────────────────────────────
  useEffect(() => {
    if (!showExportModal) return;
    const trimmed = exportSearchQuery.trim();
    if (!trimmed) {
      setExportSearchResults(null);
      setExportSearchLoading(false);
      return;
    }
    setExportSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(
          "/server/page_builder_function/searchPages",
          {
            params: { pageName: trimmed },
          },
        );
        const data = res.data;
        const results = Array.isArray(data?.data?.Pages)
          ? data.data.Pages
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.Pages)
              ? data.Pages
              : [];
        setExportSearchResults(
          results.filter((p) => (p.Status || "").toLowerCase() !== "deleted"),
        );
      } catch {
        setExportSearchResults([]);
      } finally {
        setExportSearchLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [exportSearchQuery, showExportModal]);

  // ── Open export modal ─────────────────────────────────────────────────────────
  const handleExportLeads = () => setShowExportModal(true);

  // ── Close export modal ────────────────────────────────────────────────────────
  const closeExportModal = () => {
    exportCancelledRef.current = true;
    stopPolling();
    if (exportAbortRef.current) {
      try {
        exportAbortRef.current.abort();
      } catch (_) {}
      exportAbortRef.current = null;
    }
    setShowExportModal(false);
    setExportSearchQuery("");
    setExportSearchResults(null);
    setExportSearchLoading(false);
    setExportingPage(null);
    setExportJobStatus(null);
    setExportJobMessage("");
  };

  // ── Poll job status ───────────────────────────────────────────────────────────
  const pollJobStatus = async (jobId, pageForExport) => {
    if (exportCancelledRef.current) return;
    try {
      if (!exportAbortRef.current)
        exportAbortRef.current = new AbortController();
      const res = await axios.get("/server/page_builder_function/getJobStatus", {
        params: { jobId },
        signal: exportAbortRef.current.signal,
      });
      if (exportCancelledRef.current) return;
      const data = res.data;

      // Backend success with no leads (new shape: hasData:false / totalRecords:0)
      if (
        data &&
        typeof data === "object" &&
        data.success &&
        (data.hasData === false || data.totalRecords === 0) &&
        (data.status === "Completed" || /no\s*data/i.test(data.message || ""))
      ) {
        stopPolling();
        setExportJobStatus("NoData");
        setExportJobMessage(
          data.message || "No leads available to export for this page.",
        );
        return;
      }

      // Backend responded with explicit "no data" / failure JSON
      if (data && typeof data === "object" && data.success === false) {
        stopPolling();
        if (/no\s*data/i.test(data.message || "")) {
          setExportJobStatus("NoData");
          setExportJobMessage(
            data.message || "No leads available to export for this page.",
          );
        } else {
          setExportJobStatus("Failed");
          setExportJobMessage(data.message || "Export failed.");
        }
        return;
      }

      // Backend finished — raw CSV text returned directly
      if (typeof data === "string" && data.trim().length > 0) {
        stopPolling();
        setExportJobStatus("Completed");
        setExportJobMessage("Export completed!");
        const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;

        const safePageName = (pageForExport?.PageName || "page")
          .replace(/[\\/:*?"<>|]/g, "-")
          .trim();
        a.download = `${safePageName} leads.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        return;
      }

      setExportJobStatus(data.status);
      setExportJobMessage(data.message || "");

      if (data.status !== "In-Progress") {
        stopPolling();
        const downloadUrl = data.downloadUrl || data.fileUrl || data.url;
        if (downloadUrl) {
          const a = document.createElement("a");
          a.href = downloadUrl;
          a.target = "_blank";
          a.click();
        }
      } else if (data.status === "Failed") {
        stopPolling();
      }
    } catch (err) {
      if (
        exportCancelledRef.current ||
        axios.isCancel?.(err) ||
        err?.name === "CanceledError" ||
        err?.code === "ERR_CANCELED"
      ) {
        return;
      }
      console.error("Polling error:", err);
      stopPolling();
      setExportJobStatus("Failed");
      setExportJobMessage("An error occurred while checking job status.");
    }
  };

  // ── User clicks a page to export ─────────────────────────────────────────────
  const handleExportPageClick = async (page) => {
    exportCancelledRef.current = false;
    exportAbortRef.current = new AbortController();
    setExportingPage(page);
    setExportJobStatus("creating");
    setExportJobMessage("Creating export job…");
    try {
      const res = await axios.post(
        "/server/page_builder_function/createJob",
        { pageId: page.ROWID },
        { signal: exportAbortRef.current.signal },
      );
      if (exportCancelledRef.current) return;
      const data = res.data;
      // New backend shape: success:true + Completed + hasData:false + totalRecords:0 → no leads
      if (
        data.success &&
        (data.hasData === false || data.totalRecords === 0) &&
        (data.status === "Completed" || /no\s*data/i.test(data.message || ""))
      ) {
        setExportJobStatus("NoData");
        setExportJobMessage(
          data.message || "No leads available to export for this page.",
        );
      } else if (data.success && data.jobId) {
        setExportJobStatus("In-Progress");
        setExportJobMessage("Export job created. Processing your data…");
        pollingRef.current = setInterval(
          () => pollJobStatus(data.jobId, page),
          2000,
        );
      } else if (/no\s*data/i.test(data.message || "")) {
        setExportJobStatus("NoData");
        setExportJobMessage(
          data.message || "No leads available to export for this page.",
        );
      } else {
        setExportJobStatus("Failed");
        setExportJobMessage(data.message || "Failed to create export job.");
      }
    } catch (err) {
      if (
        exportCancelledRef.current ||
        axios.isCancel?.(err) ||
        err?.name === "CanceledError" ||
        err?.code === "ERR_CANCELED"
      ) {
        return;
      }
      setExportJobStatus("Failed");
      setExportJobMessage(
        err.response?.data?.message ||
          "Error creating export job. Please try again.",
      );
    }
  };

  // ── View / Delete ─────────────────────────────────────────────────────────────
  const viewLeadDetails = (rowData) => {
    setViewingLead(rowData);
    setShowViewDialog(true);
  };

  const handleDeleteLead = async (rowData) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This lead will be deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "No, keep it",
      confirmButtonColor: "#d33",
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      setOperationLoading(true);
      try {
        await axios.delete(
          `/server/page_builder_function/leads_live/${rowData.ROWID}`,
        );
        dispatch(leadActions.deleteLead(rowData));
        Swal.fire({
          title: "Deleted!",
          text: "Lead deleted successfully.",
          icon: "success",
          confirmButtonColor: "#3085d6",
        });
      } catch {
        Swal.fire({
          title: "Failed!",
          text: "Failed to delete the lead.",
          icon: "error",
          confirmButtonColor: "#d33",
        });
      } finally {
        setOperationLoading(false);
      }
    });
  };

  const deleteSelectedLeads = async () => {
    if (selectedLeads.length === 0) return;
    Swal.fire({
      title: "Are you sure?",
      text: "The selected leads will be deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "No, keep it",
      confirmButtonColor: "#d33",
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      setOperationLoading(true);
      const rowIds = selectedLeads.map((lead) => lead.ROWID);
      try {
        await axios.delete("/server/page_builder_function/leads_live", {
          data: { rowIds },
        });
        Swal.fire({
          title: "Deleted!",
          text: "Selected leads deleted successfully.",
          icon: "success",
          confirmButtonColor: "#3085d6",
        });
        // Remove only the deleted rows from Redux so the rest of the
        // already-loaded leads stay visible (pagination, filters, etc.).
        const deletedSet = new Set(rowIds);
        const remainingLeads = leads.filter((l) => !deletedSet.has(l.ROWID));
        dispatch(
          leadActions.setLeads({
            data: remainingLeads,
            nextToken,
            hasMore,
          }),
        );
        // Also mirror the change into any page-filtered view the user is on
        setPageFilteredLeads((prev) =>
          prev.filter((l) => !deletedSet.has(l.ROWID)),
        );
        setSelectedLeads([]);
      } catch {
        Swal.fire({
          title: "Failed!",
          text: "Failed to delete selected leads.",
          icon: "error",
          confirmButtonColor: "#d33",
        });
      } finally {
        setOperationLoading(false);
      }
    });
  };

  // ── Column definitions ────────────────────────────────────────────────────────
  const columns = useMemo(
    () => [
      {
        header: "Lead ID",
        body: (row) => `LD${row.ROWID.slice(-4)}`,
        style: { minWidth: "90px", fontWeight: 600 },
      },
      {
        header: "First Name",
        body: (row) =>
          findField(
            row.Lead_data,
            ["first", "name"],
            [
              "First name ( as per Aadhar)",
              "First Name",
              "FirstName",
              "firstName",
              "first_name",
              "पहला नाम", // Hindi
              "முதல் பெயர்", // Tamil
            ],
          ) || "—",
        style: { minWidth: "130px" },
      },
      {
        header: "Last Name",
        body: (row) =>
          findField(
            row.Lead_data,
            ["last", "name"],
            [
              "Last name (as per Aadhar)",
              "Last Name",
              "LastName",
              "lastName",
              "last_name",
              "अंतिम नाम", // Hindi
              "கடைசி பெயர்", // Tamil
            ],
          ) || "—",
        style: { minWidth: "130px" },
      },
      {
        header: "Email",
        body: (row) =>
          findField(
            row.Lead_data,
            ["email"],
            [
              "Email ID",
              "Email",
              "email",
              "EmailId",
              "email_id",
              "ईमेल", // Hindi
              "மின்னஞ்சல்", // Tamil
            ],
          ) || "—",
        style: { minWidth: "190px" },
      },
      {
        header: "Page Name",
        body: (row) =>
          pages[row.pageId] || row.Lead_data?.Landing_Page_Name || "Unknown",
        style: { minWidth: "180px" },
      },
      {
        header: "CRM Sync",
        style: { minWidth: "100px" },
        body: (row) => {
          const status = row.CRMSync
            ? row.CRMSync.toString().toUpperCase()
            : "UNKNOWN";
          return (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {status === "TRUE" ? (
                <i
                  className="pi pi-check-circle"
                  style={{ color: "green", fontSize: "18px" }}
                  title="Synced"
                />
              ) : status === "FALSE" ? (
                <i
                  className="pi pi-times-circle"
                  style={{ color: "red", fontSize: "18px" }}
                  title="Not Synced"
                />
              ) : (
                <span style={{ color: "#9ca3af" }}>—</span>
              )}
            </div>
          );
        },
      },
      {
        header: "Actions",
        style: { minWidth: "80px" },
        body: (row) => {
          const buttons = [
            {
              key: "view",
              title: "View",
              icon: <HiMiniEye style={{ fontSize: 14 }} />,
              onClick: () => viewLeadDetails(row),
              gradient: "linear-gradient(135deg, #22c55e, #16a34a)",
              shadow: "0 4px 12px rgba(34,197,94,0.4)",
              hoverShadow: "0 6px 16px rgba(22,163,74,0.55)",
            },
            {
              key: "delete",
              title: "Delete",
              icon: <LuTrash2 style={{ fontSize: 14, strokeWidth: 2 }} />,
              onClick: () => handleDeleteLead(row),
              gradient: "linear-gradient(135deg, #ef4444, #dc2626)",
              shadow: "0 4px 12px rgba(239,68,68,0.4)",
              hoverShadow: "0 6px 16px rgba(220,38,38,0.55)",
            },
          ];

          return (
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {buttons.map(
                ({
                  key,
                  title,
                  icon,
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
                      onClick={onClick}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform =
                          "translateY(-2px) scale(1.08)";
                        e.currentTarget.style.boxShadow = hoverShadow;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform =
                          "translateY(0) scale(1)";
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
                        transition:
                          "transform 0.18s ease, box-shadow 0.18s ease",
                        flexShrink: 0,
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
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pages],
  );

  // ── ActionBar ─────────────────────────────────────────────────────────────────
  const actionBar = (
    <div
      style={{
        display: "flex",
        gap: "10px",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      {/* Page filter — antd Select, shared cache, with clear × and Show More */}
      <Select
        placeholder="Filter by Page"
        value={selectedPageId || undefined}
        onChange={handlePageFilterChange}
        allowClear
        showSearch
        filterOption={(input, option) =>
          (option?.label || "").toLowerCase().includes(input.toLowerCase())
        }
        style={{ minWidth: "200px" }}
        loading={allPagesInitialLoading && allPagesList.length === 0}
        options={allPagesList.map((p) => ({
          label: p.PageName,
          value: p.ROWID,
        }))}
        dropdownRender={(menu) => (
          <>
            {menu}
            {pagesListHasMore && (
              <div
                style={{
                  padding: "8px 12px",
                  borderTop: "1px solid #f0f0f0",
                  textAlign: "center",
                }}
              >
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    fetchMorePagesList();
                  }}
                  disabled={pagesListLoading}
                  style={{
                    background: "none",
                    border: "1px solid #3169be",
                    borderRadius: "6px",
                    color: pagesListLoading ? "#9ca3af" : "#3169be",
                    fontWeight: 600,
                    fontSize: "12px",
                    padding: "4px 14px",
                    cursor: pagesListLoading ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {pagesListLoading ? (
                    <>
                      <i
                        className="pi pi-spin pi-spinner"
                        style={{ fontSize: "12px" }}
                      />{" "}
                      Loading…
                    </>
                  ) : (
                    <>
                      <i
                        className="pi pi-chevron-down"
                        style={{ fontSize: "11px" }}
                      />{" "}
                      Show More Pages
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      />

      {/* Export Leads button */}
      <button
        onClick={handleExportLeads}
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
        <i className="pi pi-download" style={{ fontSize: "13px" }} />
        Export Leads
      </button>

      {/* Delete-selected button */}
      {selectedLeads.length > 0 && (
        <button
          onClick={deleteSelectedLeads}
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
          Delete ({selectedLeads.length})
        </button>
      )}
    </div>
  );

  // ── Export modal — reusable page card ─────────────────────────────────────────
  const PageCard = ({ page }) => (
    <li
      onClick={() => handleExportPageClick(page)}
      style={{
        padding: "14px 16px",
        background: "#fff",
        borderLeft: "4px solid #3169be",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        cursor: "pointer",
        transition: "transform 0.15s, box-shadow 0.15s, background 0.15s",
        listStyle: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 6px 18px rgba(49, 105, 190,0.15)";
        e.currentTarget.style.background = "#f4f8fd";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.07)";
        e.currentTarget.style.background = "#fff";
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "8px",
          background: "linear-gradient(135deg, #3169be, #1d437c)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <i className="pi pi-file" style={{ color: "#fff", fontSize: "15px" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "#1f2937",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {page.PageName}
        </div>
        <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>
          {page.Status}
        </div>
      </div>
      <i
        className="pi pi-download"
        style={{ color: "#3169be", fontSize: "16px", flexShrink: 0 }}
      />
    </li>
  );

  // ── Export modal — job status screen ─────────────────────────────────────────
  const renderJobStatus = () => {
    const isInProgress =
      exportJobStatus === "creating" || exportJobStatus === "In-Progress";
    const isCompleted = exportJobStatus === "Completed";
    const isFailed = exportJobStatus === "Failed";
    const isNoData = exportJobStatus === "NoData";

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 24px",
          gap: "20px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            background:
              "linear-gradient(135deg, #fff 0%, #f5f8fd 60%, #eaf1fb 100%)",
            border: "1px solid #d4dff0",
            borderRadius: "14px",
            padding: "14px 16px",
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 2px 10px rgba(49, 105, 190,0.08)",
            textAlign: "left",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              flexShrink: 0,
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #3169be, #6a96d8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 10px rgba(49, 105, 190,0.3)",
            }}
          >
            <i
              className="pi pi-file-excel"
              style={{ color: "#fff", fontSize: "18px" }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "11px",
                color: "#6b7e9b",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                fontWeight: 600,
                marginBottom: "2px",
              }}
            >
              Exporting Page
            </div>
            <div
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#1a407a",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={exportingPage?.PageName || "Selected Page"}
            >
              {exportingPage?.PageName || "Selected Page"}
            </div>
          </div>
        </div>

        {isInProgress && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
              width: "100%",
            }}
          >
            <style>{`
              @keyframes al-spin-out { to { transform: rotate(360deg); } }
              @keyframes al-spin-in  { to { transform: rotate(-360deg); } }
              @keyframes al-pulse    { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(0.75); opacity: 0.6; } }
              @keyframes al-bar      { 0% { left: -40%; } 100% { left: 100%; } }
              @keyframes al-dots     { 0%,20% { content: ""; } 40% { content: "."; } 60% { content: ".."; } 80%,100% { content: "..."; } }
            `}</style>

            {/* Dual-ring spinner with pulsing core */}
            <div
              style={{
                position: "relative",
                width: "84px",
                height: "84px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  border: "4px solid #e6ecf5",
                  borderTopColor: "#3169be",
                  borderRightColor: "#3169be",
                  animation:
                    "al-spin-out 1.1s cubic-bezier(0.4,0,0.2,1) infinite",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: "12px",
                  borderRadius: "50%",
                  border: "3px solid #eaf1fb",
                  borderBottomColor: "#6a96d8",
                  borderLeftColor: "#6a96d8",
                  animation:
                    "al-spin-in 1.4s cubic-bezier(0.4,0,0.2,1) infinite",
                }}
              />
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #3169be, #6a96d8)",
                  boxShadow: "0 0 12px rgba(49, 105, 190,0.45)",
                  animation: "al-pulse 1.3s ease-in-out infinite",
                }}
              />
            </div>

            <div
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#1f2937",
                letterSpacing: "0.2px",
              }}
            >
              {exportJobStatus === "creating"
                ? "Preparing your export"
                : "Processing your data"}
              <span
                style={{
                  display: "inline-block",
                  width: "18px",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    animation: "al-dots 1.4s steps(4,end) infinite",
                  }}
                >
                  ...
                </span>
              </span>
            </div>

            {/* Indeterminate progress bar */}
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "6px",
                borderRadius: "999px",
                background: "#f3f4f6",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  width: "40%",
                  borderRadius: "999px",
                  background:
                    "linear-gradient(90deg, transparent, #3169be, transparent)",
                  animation: "al-bar 1.6s ease-in-out infinite",
                }}
              />
            </div>

            {exportJobMessage && exportJobStatus !== "creating" && (
              <div style={{ fontSize: "13px", color: "#6b7280" }}>
                {exportJobMessage}
              </div>
            )}
            <div style={{ fontSize: "12px", color: "#9ca3af" }}>
              Please keep this window open — this may take a few moments.
            </div>

            <button
              onClick={handleCancelExport}
              style={{
                marginTop: "6px",
                padding: "8px 22px",
                background: "#fff",
                color: "#dc2626",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#fef2f2")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
            >
              <i className="pi pi-times" style={{ fontSize: "12px" }} />
              Cancel Export
            </button>
          </div>
        )}

        {isNoData && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #fef3c7, #fde68a)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 16px rgba(234,179,8,0.25)",
              }}
            >
              <i
                className="pi pi-inbox"
                style={{ color: "#b45309", fontSize: "28px" }}
              />
            </div>
            <div
              style={{ fontSize: "15px", fontWeight: 700, color: "#b45309" }}
            >
              No Leads to Export
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "#6b7280",
                maxWidth: "320px",
              }}
            >
              {exportJobMessage ||
                "There are no leads available for this page yet."}
            </div>
            <button
              onClick={() => {
                setExportingPage(null);
                setExportJobStatus(null);
                setExportJobMessage("");
              }}
              style={{
                marginTop: "8px",
                padding: "8px 24px",
                background: "#3169be",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              ← Back to Pages
            </button>
          </div>
        )}

        {isCompleted && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 16px rgba(34,197,94,0.35)",
              }}
            >
              <i
                className="pi pi-check"
                style={{ color: "#fff", fontSize: "24px" }}
              />
            </div>
            <div
              style={{ fontSize: "15px", fontWeight: 700, color: "#15803d" }}
            >
              Export Completed!
            </div>
            <div style={{ fontSize: "13px", color: "#6b7280" }}>
              Your file has been downloaded successfully.
            </div>
            <button
              onClick={closeExportModal}
              style={{
                marginTop: "8px",
                padding: "8px 24px",
                background: "#3169be",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        )}

        {isFailed && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 16px rgba(239,68,68,0.35)",
              }}
            >
              <i
                className="pi pi-times"
                style={{ color: "#fff", fontSize: "24px" }}
              />
            </div>
            <div
              style={{ fontSize: "15px", fontWeight: 700, color: "#dc2626" }}
            >
              Export Failed
            </div>
            <div style={{ fontSize: "13px", color: "#6b7280" }}>
              {exportJobMessage || "Something went wrong. Please try again."}
            </div>
            <button
              onClick={() => {
                setExportingPage(null);
                setExportJobStatus(null);
                setExportJobMessage("");
              }}
              style={{
                marginTop: "8px",
                padding: "8px 24px",
                background: "#3169be",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              ← Back to Pages
            </button>
          </div>
        )}
      </div>
    );
  };

  // ── Export modal — page list screen ──────────────────────────────────────────
  const renderPageList = () => {
    const isSearchActive = exportSearchQuery.trim().length > 0;
    const listToShow = isSearchActive
      ? exportSearchResults || []
      : allPagesList;
    const isListLoading = isSearchActive
      ? exportSearchLoading
      : (allPagesInitialLoading && allPagesList.length === 0) ||
        (pagesListLoading && allPagesList.length === 0);

    return (
      <div style={{ padding: "4px 0" }}>
        {/* Search bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            padding: "8px 14px",
            marginBottom: "16px",
          }}
        >
          {exportSearchLoading ? (
            <i
              className="pi pi-spin pi-spinner"
              style={{ color: "#3169be", fontSize: "15px", flexShrink: 0 }}
            />
          ) : (
            <i
              className="pi pi-search"
              style={{ color: "#9ca3af", fontSize: "15px", flexShrink: 0 }}
            />
          )}
          <input
            type="text"
            placeholder="Search pages by name…"
            value={exportSearchQuery}
            onChange={(e) => setExportSearchQuery(e.target.value)}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "14px",
              color: "#1f2937",
            }}
          />
          {exportSearchQuery && (
            <button
              onClick={() => setExportSearchQuery("")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#9ca3af",
                padding: 0,
                display: "flex",
                alignItems: "center",
              }}
            >
              <i className="pi pi-times" style={{ fontSize: "13px" }} />
            </button>
          )}
        </div>

        {/* List */}
        {isListLoading ? (
          <div
            style={{ textAlign: "center", padding: "32px 0", color: "#6b7280" }}
          >
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: "3px solid #f3f4f6",
                borderTop: "3px solid #3169be",
                animation: "spin 0.9s linear infinite",
                margin: "0 auto 12px",
              }}
            />
            {isSearchActive ? "Searching…" : "Loading pages…"}
          </div>
        ) : listToShow.length === 0 ? (
          <p
            style={{ color: "#6b7280", textAlign: "center", padding: "24px 0" }}
          >
            {isSearchActive
              ? "No pages found for your search."
              : "No pages available."}
          </p>
        ) : (
          <>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "grid",
                gap: "10px",
              }}
            >
              {listToShow.map((page) => (
                <PageCard key={page.ROWID} page={page} />
              ))}
            </ul>

            {/* Show More Pages — only when NOT searching */}
            {!isSearchActive && pagesListHasMore && (
              <div style={{ textAlign: "center", marginTop: "16px" }}>
                <button
                  onClick={fetchMorePagesList}
                  disabled={pagesListLoading}
                  style={{
                    padding: "8px 20px",
                    background: pagesListLoading ? "#f3f4f6" : "#fff",
                    border: "1px solid #3169be",
                    borderRadius: "8px",
                    color: pagesListLoading ? "#9ca3af" : "#3169be",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: pagesListLoading ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  onMouseEnter={(e) => {
                    if (!pagesListLoading)
                      e.currentTarget.style.background = "#f4f8fd";
                  }}
                  onMouseLeave={(e) => {
                    if (!pagesListLoading)
                      e.currentTarget.style.background = "#fff";
                  }}
                >
                  {pagesListLoading ? (
                    <>
                      <i
                        className="pi pi-spin pi-spinner"
                        style={{ fontSize: "13px" }}
                      />{" "}
                      Loading…
                    </>
                  ) : (
                    <>
                      <i
                        className="pi pi-chevron-down"
                        style={{ fontSize: "12px" }}
                      />{" "}
                      Show More Pages
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════
          Export Modal
      ══════════════════════════════════════════════════════════════════ */}
      <Modal
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              paddingLeft: "4px",
            }}
          >
            {exportingPage ? (
              <>
                {(exportJobStatus === "creating" ||
                  exportJobStatus === "In-Progress") && (
                  <i
                    className="pi pi-spin pi-spinner"
                    style={{ fontSize: "15px", color: "#3169be" }}
                  />
                )}
                {exportJobStatus === "Completed" && (
                  <i
                    className="pi pi-check-circle"
                    style={{ fontSize: "15px", color: "#22c55e" }}
                  />
                )}
                {exportJobStatus === "Failed" && (
                  <i
                    className="pi pi-times-circle"
                    style={{ fontSize: "15px", color: "#ef4444" }}
                  />
                )}
                <span>Export Status</span>
              </>
            ) : (
              <>
                <i
                  className="pi pi-file-excel"
                  style={{ fontSize: "15px", color: "#28a745" }}
                />
                <span>Download Leads</span>
              </>
            )}
          </div>
        }
        open={showExportModal}
        onCancel={closeExportModal}
        footer={null}
        width={560}
        centered
        styles={{
          body: {
            padding: "16px",
            backgroundColor: "#fff",
            maxHeight: "520px",
            overflowY: "auto",
            borderRadius: "8px",
          },
        }}
      >
        {exportingPage ? renderJobStatus() : renderPageList()}
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════
          Main container
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ padding: "20px" }}>
        {showViewDialog && (
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

        <CustomDataTable
          columns={columns}
          data={pageData}
          dataKey="ROWID"
          loading={loading}
          emptyMessage="No leads found."
          title="Leads"
          actionBar={actionBar}
          selectable
          selectedRows={selectedLeads}
          onSelectionChange={setSelectedLeads}
          first={first}
          rows={rows}
          totalRecords={totalRecords}
          onPageChange={onPageChange}
          rowsPerPageOptions={[5, 10, 20, 50]}
          hasMore={effectiveHasMore}
        />

        <ToastContainer position="bottom-right" autoClose={5000} />

        {/* ══════════════════════════════════════════════════════════════
            View Lead — slide-in panel
        ══════════════════════════════════════════════════════════════ */}
        <Modal
          title={null}
          open={showViewDialog}
          onCancel={() => setShowViewDialog(false)}
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
          {viewingLead && (
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                background: "#f6f8fb",
              }}
            >
              {/* Header */}
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
                      Lead Details
                    </div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "22px",
                        fontWeight: 700,
                        lineHeight: 1.2,
                      }}
                    >
                      {[
                        viewingLead?.Lead_data?.["First name ( as per Aadhar)"],
                        viewingLead?.Lead_data?.["Last name (as per Aadhar)"],
                      ]
                        .filter(Boolean)
                        .join(" ") || `LD${viewingLead.ROWID.slice(-4)}`}
                    </h2>
                  </div>
                  <div
                    style={{
                      minWidth: "72px",
                      height: "72px",
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.16)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      fontWeight: 700,
                      border: "1px solid rgba(255,255,255,0.2)",
                      backdropFilter: "blur(6px)",
                    }}
                  >
                    {(
                      (viewingLead?.Lead_data?.[
                        "First name ( as per Aadhar)"
                      ]?.[0] || "") +
                      (viewingLead?.Lead_data?.[
                        "Last name (as per Aadhar)"
                      ]?.[0] || "")
                    ).toUpperCase() || "LD"}
                  </div>
                </div>

                {/* Pills */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                    marginTop: "16px",
                  }}
                >
                  {[
                    {
                      label: "Lead ID",
                      value: `LD${viewingLead.ROWID.slice(-4)}`,
                    },
                    pages[viewingLead.pageId]
                      ? { label: "Page", value: pages[viewingLead.pageId] }
                      : null,
                  ]
                    .filter(Boolean)
                    .map((pill) => (
                      <div
                        key={pill.label}
                        style={{
                          background: "rgba(255,255,255,0.14)",
                          border: "1px solid rgba(255,255,255,0.18)",
                          padding: "8px 12px",
                          borderRadius: "999px",
                          fontSize: "13px",
                        }}
                      >
                        {pill.label}: <strong>{pill.value}</strong>
                      </div>
                    ))}
                  <div
                    style={{
                      background: "rgba(255,255,255,0.14)",
                      border: "1px solid rgba(255,255,255,0.18)",
                      padding: "8px 12px",
                      borderRadius: "999px",
                      fontSize: "13px",
                    }}
                  >
                    CRM Sync:{" "}
                    <strong
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {String(viewingLead.CRMSync).toUpperCase() === "TRUE" ? (
                        <>
                          <i
                            className="pi pi-check-circle"
                            style={{ color: "#86efac", fontSize: "14px" }}
                          />
                          Synced
                        </>
                      ) : String(viewingLead.CRMSync).toUpperCase() ===
                        "FALSE" ? (
                        <>
                          <i
                            className="pi pi-times-circle"
                            style={{ color: "#fca5a5", fontSize: "14px" }}
                          />
                          Not Synced
                        </>
                      ) : (
                        "Unknown"
                      )}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Fields */}
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
                    Lead Information
                  </div>
                  <div style={{ display: "grid", gap: "14px" }}>
                    {Object.entries(viewingLead.Lead_data)
                      .filter(
                        ([key]) =>
                          key !== "authorizeCheckbox" &&
                          key !== "leadId" &&
                          key !== "null",
                      )
                      .map(([key, value]) => (
                        <div
                          key={key}
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
                            {key
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (c) => c.toUpperCase())}
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
                            {Array.isArray(value) ? (
                              value.join(", ")
                            ) : value ? (
                              value
                            ) : (
                              <span style={{ color: "#9ca3af" }}>N/A</span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </>
  );
}
