import React, { useState, useEffect, useMemo, useCallback } from "react";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Switch, Modal, notification } from "antd";
import axios from "axios";
import { PropagateLoader } from "react-spinners";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CustomDataTable from "../../components/CustomDataTable";

// ── Cache key ─────────────────────────────────────────────────────────────────
const QUERY_KEY = ["form-settings-pages"];

// ── Readable date formatter ───────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const FormSettings = () => {
  const queryClient = useQueryClient();

  const [pages, setPages] = useState([]);
  const [metadataMap, setMetadataMap] = useState({});
  const [toggleStatuses, setToggleStatuses] = useState({});
  const [captchaStatuses, setCaptchaStatuses] = useState({});
  const [globalFilter, setGlobalFilter] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [currentToggle, setCurrentToggle] = useState({
    pageId: null,
    checked: false,
  });
  const toast = React.useRef(null);

  // ── Token pagination state ────────────────────────────────────────────────
  const [nextToken, setNextToken] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);

  // ── Table pagination state ────────────────────────────────────────────────
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(20);

  // ── Build metadata/toggle/captcha maps directly from page.stepformdata ───
  const buildMapsFromBatch = (publishedBatch) => {
    const newMetadataMap = {};
    const newToggleStatuses = {};
    const newCaptchaStatuses = {};

    publishedBatch.forEach((page) => {
      let metadata = [];
      if (page.stepformdata) {
        try {
          metadata = JSON.parse(page.stepformdata);
        } catch {
          metadata = [];
        }
      }
      newMetadataMap[page.ROWID] = metadata;

      const otpField = metadata.find((f) => f.otpValidation !== undefined);
      if (otpField)
        newToggleStatuses[page.ROWID] = otpField.otpValidation === "yes";

      const captchaField = metadata.find(
        (f) => f.captchaValidation !== undefined,
      );
      if (captchaField)
        newCaptchaStatuses[page.ROWID] =
          captchaField.captchaValidation === "yes";
    });

    return { newMetadataMap, newToggleStatuses, newCaptchaStatuses };
  };

  // ── TanStack Query — initial fetch (cached for 5 min) ────────────────────
  // enabled: true always — staleTime prevents redundant network calls.
  // The sync effect below guards against overwriting already-loaded state.
  const { data: pagesQueryData, isLoading: pagesInitialLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const response = await axios.get(
        "/server/page_builder_function/all-pages",
      );
      if (!response.data.success) throw new Error("Failed to fetch pages.");
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true, // uses cached value within staleTime, re-fetches after
  });

  // ── Sync TanStack cache → local state ONLY when local state is empty ──────
  // On first visit:  cache is empty → query fetches → this effect populates state.
  // On return visit: cache is fresh → isLoading=false immediately → this effect
  //                  restores state from cache with zero network requests.
  // fetchMorePages-accumulated pages are never overwritten because
  // pages.length > 0 after the first sync.
  useEffect(() => {
    if (!pagesQueryData || pages.length > 0) return;

    const allFetched = pagesQueryData.data || [];
    const publishedPages = allFetched.filter(
      (page) => page.Status === "Published",
    );

    const { newMetadataMap, newToggleStatuses, newCaptchaStatuses } =
      buildMapsFromBatch(publishedPages);

    setPages(publishedPages);
    setMetadataMap(newMetadataMap);
    setToggleStatuses(newToggleStatuses);
    setCaptchaStatuses(newCaptchaStatuses);
    setNextToken(pagesQueryData.pagination?.next_token || null);
    setHasMore(pagesQueryData.pagination?.more_records || false);
  }, [pagesQueryData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Combined loading flag — only true on the very first fetch (no cache yet)
  const loading = pagesInitialLoading;

  // ── Fetch next token batch ────────────────────────────────────────────────
  const fetchMorePages = useCallback(async () => {
    if (!hasMore || !nextToken || fetchingMore) return;
    setFetchingMore(true);
    try {
      const response = await axios.get(
        `/server/page_builder_function/all-pages?token=${nextToken}`,
      );
      if (response.data.success) {
        const newBatch = response.data.data || [];
        const newNextToken = response.data.pagination?.next_token || null;
        const newHasMore = response.data.pagination?.more_records || false;
        const publishedBatch = newBatch.filter(
          (page) => page.Status === "Published",
        );

        const { newMetadataMap, newToggleStatuses, newCaptchaStatuses } =
          buildMapsFromBatch(publishedBatch);

        setPages((prev) => [...prev, ...publishedBatch]);
        setMetadataMap((prev) => ({ ...prev, ...newMetadataMap }));
        setToggleStatuses((prev) => ({ ...prev, ...newToggleStatuses }));
        setCaptchaStatuses((prev) => ({ ...prev, ...newCaptchaStatuses }));
        setNextToken(newNextToken);
        setHasMore(newHasMore);

        // Write full accumulated raw data back into TanStack cache so that
        // navigating away and returning restores every fetched record, not
        // just the first batch.
        queryClient.setQueryData(QUERY_KEY, (old) => ({
          success: true,
          data: [...(old?.data || []), ...newBatch], // all statuses, not just Published
          pagination: { next_token: newNextToken, more_records: newHasMore },
        }));
      }
    } catch (error) {
      console.error("Error fetching more pages:", error);
    } finally {
      setFetchingMore(false);
    }
  }, [hasMore, nextToken, fetchingMore, queryClient]);

  // Reset to page 1 whenever the search query changes
  useEffect(() => {
    setFirst(0);
  }, [globalFilter]);

  const showNotification = (status, pageName, noStepForm = false) => {
    notification.info({
      message: noStepForm ? "No Step Form" : "Validation Updated",
      description: noStepForm
        ? `There is no step form in this page (${pageName}).`
        : `Validation set to ${status ? "enabled" : "disabled"} for ${pageName}.`,
      duration: 3,
    });
  };

  // ── Update validation — uses in-memory metadataMap, no extra API fetch ───
  const updateValidation = async (pageId, checked, validationType) => {
    setConfirmLoading(true);
    try {
      const metadata = metadataMap[pageId] || [];
      const selectedPage = pages.find((page) => page.ROWID === pageId);

      if (
        metadata.length === 0 ||
        !metadata.some((field) => field[validationType] !== undefined)
      ) {
        showNotification(checked, selectedPage.PageName, true);
        return;
      }

      const updatedMetadata = metadata.map((field) => ({
        ...field,
        [validationType]:
          field[validationType] !== undefined
            ? checked
              ? "yes"
              : "no"
            : field[validationType],
      }));

      await axios.put(`/server/page_builder_function/update/page/${pageId}`, {
        stepformdata: JSON.stringify(updatedMetadata),
      });

      // Update local state
      setMetadataMap((prev) => ({ ...prev, [pageId]: updatedMetadata }));

      // Keep TanStack cache in sync so navigating away and back reflects
      // the updated stepformdata correctly
      queryClient.setQueryData(QUERY_KEY, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((page) =>
            page.ROWID === pageId
              ? { ...page, stepformdata: JSON.stringify(updatedMetadata) }
              : page,
          ),
        };
      });

      showNotification(checked, selectedPage.PageName);

      if (validationType === "otpValidation") {
        setToggleStatuses((prev) => ({ ...prev, [pageId]: checked }));
      } else if (validationType === "captchaValidation") {
        setCaptchaStatuses((prev) => ({ ...prev, [pageId]: checked }));
      }
    } catch (error) {
      console.error(
        `Error updating ${validationType} validation status:`,
        error,
      );
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleToggleChange = (pageId, checked) => {
    setCurrentToggle({ pageId, checked });
    Modal.confirm({
      title: "Are you sure?",
      content: `Are you sure you want to set OTP validation to ${checked ? "enabled" : "disabled"} for this page?`,
      okText: "Yes",
      cancelText: "No",
      onOk: () => updateValidation(pageId, checked, "otpValidation"),
      onCancel: () =>
        setToggleStatuses((prev) => ({ ...prev, [pageId]: !checked })),
    });
  };

  const handleCaptchaToggle = (pageId, checked) => {
    setCurrentToggle({ pageId, checked });
    Modal.confirm({
      title: "Are you sure?",
      content: `Are you sure you want to set Captcha validation to ${checked ? "enabled" : "disabled"} for this page?`,
      okText: "Yes",
      cancelText: "No",
      onOk: () => updateValidation(pageId, checked, "captchaValidation"),
      onCancel: () =>
        setCaptchaStatuses((prev) => ({ ...prev, [pageId]: !checked })),
    });
  };

  // ── Client-side filter ────────────────────────────────────────────────────
  const filteredPages = useMemo(() => {
    if (!globalFilter) return pages;
    const lower = globalFilter.toLowerCase();
    return pages.filter(
      (page) =>
        (page.PageName || "").toLowerCase().includes(lower) ||
        (page.CreatedBy || "").toLowerCase().includes(lower),
    );
  }, [pages, globalFilter]);

  // ── Paginated slice ───────────────────────────────────────────────────────
  const pageData = useMemo(
    () => filteredPages.slice(first, first + rows),
    [filteredPages, first, rows],
  );

  // ── +1 trick: phantom extra record keeps Next enabled when more exist ─────
  const totalRecords =
    !globalFilter && hasMore ? filteredPages.length + 1 : filteredPages.length;

  // ── Pagination handler — triggers token fetch on last page ────────────────
  const onPageChange = useCallback(
    (event) => {
      const newPage = event.page;
      const lastPage = Math.ceil(
        (filteredPages.length + (!globalFilter && hasMore ? 1 : 0)) /
          event.rows,
      );
      setFirst(event.first);
      setRows(event.rows);
      if (!globalFilter && hasMore && newPage + 1 === lastPage) {
        fetchMorePages();
      }
    },
    [filteredPages.length, hasMore, fetchMorePages, globalFilter],
  );

  // ── Column definitions ────────────────────────────────────────────────────
  const columns = [
    { field: "PageName", header: "Page Name" },
    { field: "CreatedBy", header: "Created By" },
    {
      field: "CREATEDTIME",
      header: "Created Time",
      body: (rowData) => formatDate(rowData.CREATEDTIME),
    },
    {
      header: "OTP Validation",
      body: (rowData) => {
        const metadata = metadataMap[rowData.ROWID];
        const otpFieldExists = metadata?.some(
          (field) => field.otpValidation !== undefined,
        );
        return otpFieldExists ? (
          <Switch
            checked={toggleStatuses[rowData.ROWID]}
            onChange={(checked) => handleToggleChange(rowData.ROWID, checked)}
            loading={confirmLoading && currentToggle.pageId === rowData.ROWID}
          />
        ) : (
          <span style={{ fontSize: "12px" }} className="text-red-500">
            Not Applicable
          </span>
        );
      },
    },
    {
      header: "Captcha Validation",
      body: (rowData) => {
        const metadata = metadataMap[rowData.ROWID];
        const captchaFieldExists = metadata?.some(
          (field) => field.captchaValidation !== undefined,
        );
        return captchaFieldExists ? (
          <Switch
            checked={captchaStatuses[rowData.ROWID]}
            onChange={(checked) => handleCaptchaToggle(rowData.ROWID, checked)}
            loading={confirmLoading && currentToggle.pageId === rowData.ROWID}
          />
        ) : (
          <span className="text-red-500">Not Applicable</span>
        );
      },
    },
  ];

  // ── Full-page loader (only on very first fetch — cache miss) ─────────────
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <PropagateLoader color="#3169BE" size={15} />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px" }}>
      <Toast ref={toast} />

      {/* Top Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ margin: 0, color: "#333" }}>Form Settings</h2>
        <div className="p-inputgroup" style={{ width: "250px" }}>
          <InputText
            placeholder="Search by Page Name or Created By"
            onInput={(e) => setGlobalFilter(e.target.value)}
          />
        </div>
      </div>

      <CustomDataTable
        columns={columns}
        data={pageData}
        dataKey="ROWID"
        loading={false}
        emptyMessage="No pages found."
        first={first}
        rows={rows}
        totalRecords={totalRecords}
        onPageChange={onPageChange}
        rowsPerPageOptions={[5, 10, 20, 50]}
        hasMore={!globalFilter && hasMore}
      />
    </div>
  );
};

export default FormSettings;
