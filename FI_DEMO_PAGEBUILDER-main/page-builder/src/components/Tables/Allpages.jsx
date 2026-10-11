import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageTable from "./PageTable";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Modal } from "antd";
import { PropagateLoader } from "react-spinners";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// ─── Tab labels ───────────────────────────────────────────────────────────────
const TABS = ["All Pages", "Published", "Drafted", "Deleted"];

export default function AllPages() {
  const queryClient = useQueryClient();

  // ── Token-paginated pages (accumulated into local array) ───────────────────
  const [allPages, setAllPages]   = useState([]);
  const [nextToken, setNextToken] = useState(null);
  const [hasMore, setHasMore]     = useState(false);

  // ── DB search state ────────────────────────────────────────────────────────
  // `searchResults` is null when no search is active; an array when a search
  // has returned results.  This keeps "no search" and "empty results" distinct.
  const [searchResults, setSearchResults]   = useState(null);
  const [searchLoading, setSearchLoading]   = useState(false);

  // ── Other UI state (unchanged) ─────────────────────────────────────────────
  const [operationLoading, setOperationLoading]   = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [pageToDelete, setPageToDelete]           = useState(null);
  const [selectedTab, setSelectedTab]             = useState("All Pages");
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const navigate = useNavigate();

  // ── TanStack Query – first-page fetch (cached for 5 min) ──────────────────
  // enabled:true always — staleTime prevents redundant network calls.
  // The sync effect below guards against overwriting already-loaded state.
  const { data: pagesQueryData, isLoading: pagesLoading } = useQuery({
    queryKey: ["all-pages"],
    queryFn: async () => {
      const response = await fetch("/server/page_builder_function/all-pages");
      const data = await response.json();
      if (!data.success) throw new Error("Failed to fetch pages.");
      return data;
    },
    staleTime:           5 * 60 * 1000,
    gcTime:              10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount:       true,   // uses cached value within staleTime, re-fetches after
  });

  // Sync TanStack result → local state ONLY when local state is empty.
  // This means the initial load (and any invalidated re-fetch) populates allPages,
  // but fetchMorePages-accumulated extra pages are never overwritten.
  useEffect(() => {
    if (!pagesQueryData || allPages.length > 0) return;
    setAllPages(pagesQueryData.data || []);
    setNextToken(pagesQueryData.pagination?.next_token || null);
    setHasMore(pagesQueryData.pagination?.more_records || false);
  }, [pagesQueryData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Combined loading for the full-page overlay
  const loading = pagesLoading || operationLoading || searchLoading;

  // ── Fetch next token batch ─────────────────────────────────────────────────
  const fetchMorePages = useCallback(async () => {
    if (!hasMore || !nextToken) return;
    try {
      const response = await fetch(
        `/server/page_builder_function/all-pages?token=${nextToken}`
      );
      const data = await response.json();
      if (data.success) {
        const newBatch     = data.data || [];
        const newNextToken = data.pagination?.next_token   || null;
        const newHasMore   = data.pagination?.more_records || false;

        setAllPages((prev) => {
          const accumulated = [...prev, ...newBatch];
          // Write the full accumulated list back into the TanStack cache so that
          // navigating away and returning restores every fetched record, not just
          // the first batch.
          queryClient.setQueryData(["all-pages"], {
            success: true,
            data: accumulated,
            pagination: { next_token: newNextToken, more_records: newHasMore },
          });
          return accumulated;
        });
        setNextToken(newNextToken);
        setHasMore(newHasMore);
      }
    } catch {
      toast.error("Error fetching more pages.");
    }
  }, [hasMore, nextToken, queryClient]);

  // ── Debounced DB search ────────────────────────────────────────────────────
  // Fires 500 ms after the user stops typing.
  // Clears results immediately when the search box is emptied.
  useEffect(() => {
    const trimmed = globalFilterValue.trim();

    if (!trimmed) {
      setSearchResults(null);  // back to paginated allPages view
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res  = await fetch(
          `/server/page_builder_function/searchPages?pageName=${encodeURIComponent(trimmed)}`
        );
        const data = await res.json();
        // Search API returns { data: { Pages: [...] } }
        // Fall back through possible shapes so we always store a plain array.
        const pages =
          Array.isArray(data?.data?.Pages) ? data.data.Pages :
          Array.isArray(data?.data)        ? data.data       :
          Array.isArray(data?.Pages)       ? data.Pages      :
          [];
        setSearchResults(pages);
      } catch {
        setSearchResults([]);
        toast.error("Error searching pages.");
      } finally {
        setSearchLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [globalFilterValue]);

  // ── Tab-based filter ───────────────────────────────────────────────────────
  // When a search is active, filter search results by tab.
  // When no search, filter the accumulated allPages by tab.
  const isSearchActive = searchResults !== null;
  // Always coerce to array so .filter never throws even if the API shape changes
  const sourcePages = Array.isArray(isSearchActive ? searchResults : allPages)
    ? (isSearchActive ? searchResults : allPages)
    : [];

  const filteredPages = sourcePages.filter((page) => {
    const status = (page?.Status || "").toLowerCase();
    if (selectedTab === "All Pages") return status !== "deleted";
    const statusToMatch =
      selectedTab === "Drafted" ? "draft" : selectedTab.toLowerCase();
    return status === statusToMatch;
  });

  // hasMore only applies when no search is active (token pagination disabled
  // during search since results come entirely from the search API).
  const pagesHasMore = !isSearchActive && hasMore;

  // ── Search handler — PageTable passes a plain string ──────────────────────
  const onGlobalFilterChange = (e) => {
    setGlobalFilterValue(e.target.value);
  };

  // ── Shared helper: fetch first page and replace local state atomically ──────
  // IMPORTANT: never clears allPages *before* new data arrives.
  // This ensures filteredPages in PageTable is never momentarily empty,
  // which would trigger the out-of-bounds guard and reset pagination to page 1.
  const fetchAndReplacePages = useCallback(async () => {
    try {
      const response = await fetch("/server/page_builder_function/all-pages");
      const data = await response.json();
      if (data.success) {
        // Atomic replacement — pagination position is preserved in PageTable
        // because filteredPages never went through an empty intermediate state.
        setAllPages(data.data || []);
        setNextToken(data.pagination?.next_token || null);
        setHasMore(data.pagination?.more_records || false);
        // Update TanStack cache so future navigations within staleTime use fresh data
        queryClient.setQueryData(["all-pages"], data);
      } else {
        toast.error("Failed to refresh pages.");
      }
    } catch {
      toast.error("Error refreshing pages.");
    }
  }, [queryClient]);

  // ── Refresh callback (called by PageTable after inline edits / clones) ─────
  // Clears active search, then re-fetches WITHOUT clearing allPages first.
  const refreshPages = useCallback(async () => {
    setSearchResults(null);
    setGlobalFilterValue("");
    await fetchAndReplacePages();
  }, [fetchAndReplacePages]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Page actions ───────────────────────────────────────────────────────────
  const viewPage = (rowData) => {
    const url = `${window.location.origin}/#/${rowData.pageSlug}`;
    window.open(url, "_blank");
  };

  const editPage = async (rowData) => {
    try {
      const response = await fetch(
        `/server/page_builder_function/page/${rowData.ROWID}`
      );
      const htmlContent = await response.text();
      navigate(`/page-editor/${rowData.PageName}`, {
        state: {
          htmlContent,
          rowId:           rowData.ROWID,
          initialPageName: rowData.PageName,
          initialStatus:   rowData.Status,
        },
      });
    } catch {
      toast.error("Error fetching page for editing.");
    }
  };

  const confirmDeletePage = (rowData) => {
    setPageToDelete(rowData);
    setDeleteModalVisible(true);
  };

  const handleDeletePage = async () => {
    if (!pageToDelete) return;
    setOperationLoading(true);
    try {
      const isAlreadyDeleted = (pageToDelete.Status || "").toLowerCase() === "deleted";

      const response = isAlreadyDeleted
        ? await fetch(
            `/server/page_builder_function/delete/page/${pageToDelete.ROWID}`,
            { method: "DELETE" }
          )
        : await fetch(
            `/server/page_builder_function/update/page/${pageToDelete.ROWID}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "Deleted" }),
            }
          );

      if (response.ok) {
        toast.success(
          isAlreadyDeleted
            ? "Page permanently deleted!"
            : "Page moved to Recycle Bin!"
        );
        // Re-fetch and atomically replace — never clear allPages first
        // so pagination position is preserved (out-of-bounds guard handles
        // the case where the current page no longer exists after deletion).
        await fetchAndReplacePages();
      } else {
        toast.error("Failed to delete the page.");
      }
    } catch {
      toast.error("An error occurred while deleting the page.");
    } finally {
      setOperationLoading(false);
      setDeleteModalVisible(false);
      setPageToDelete(null);
    }
  };

  // ── Tab buttons ────────────────────────────────────────────────────────────
  const tabHeaderContent = (
    <div
      style={{
        display: "flex",
        gap: "8px",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      {TABS.map((tab) => {
        const isActive = selectedTab === tab;
        return (
          <button
            key={tab}
            onClick={() => {
              setSelectedTab(tab);
              setGlobalFilterValue(""); // clear search on tab change
              setSearchResults(null);  // clear DB search results
            }}
            style={{
              padding: "6px 14px",
              backgroundColor: isActive ? "#3169be" : "#f3f4f6",
              color: isActive ? "#fff" : "#374151",
              border: `1px solid ${isActive ? "#3169be" : "#d1d5db"}`,
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: isActive ? 600 : 400,
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = "#e5e7eb";
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = "#f3f4f6";
            }}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "20px", position: "relative" }}>
      <ToastContainer
        position="top-right"
        style={{ marginTop: "150px" }}
        autoClose={3000}
      />

      {/* Full-screen loading overlay */}
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
          <PropagateLoader color="#3169be" size={20} />
        </div>
      )}

      {/* PageTable receives:
          • filteredPages  – tab-filtered slice of allPages or searchResults
          • hasMore        – tells PageTable/CustomDataTable to keep Next enabled
          • onFetchMore    – called when user reaches the last loaded page       */}
      <PageTable
        pages={filteredPages}
        globalFilterValue={globalFilterValue}
        onGlobalFilterChange={onGlobalFilterChange}
        viewPage={viewPage}
        editPage={editPage}
        confirmDeletePage={confirmDeletePage}
        fetchPage={refreshPages}
        headerContent={tabHeaderContent}
        hasMore={pagesHasMore}
        onFetchMore={fetchMorePages}
        dataLoading={loading}
      />

      {/* Delete confirmation modal */}
      <Modal
        title="Confirm Delete"
        open={deleteModalVisible}
        onOk={handleDeletePage}
        onCancel={() => {
          setDeleteModalVisible(false);
          setPageToDelete(null);
        }}
        okText={
          pageToDelete?.Status?.toLowerCase() === "deleted"
            ? "Yes, Permanently Delete"
            : "Yes, Move to Recycle Bin"
        }
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <p style={{ lineHeight: "1.6rem" }}>
          {pageToDelete?.Status?.toLowerCase() === "deleted" ? (
            <>
              <strong>{pageToDelete?.PageName}</strong> is already in the{" "}
              <strong>Recycle Bin</strong>.<br />
              Do you want to <strong>permanently delete</strong> this page?
              <br />
              <span style={{ color: "red" }}>
                This action cannot be undone.
              </span>
            </>
          ) : (
            <>
              Are you sure you want to move{" "}
              <strong>{pageToDelete?.PageName}</strong> to the{" "}
              <strong>Recycle Bin</strong>?<br />
              You can restore it later if needed.
            </>
          )}
        </p>
      </Modal>
    </div>
  );
}
