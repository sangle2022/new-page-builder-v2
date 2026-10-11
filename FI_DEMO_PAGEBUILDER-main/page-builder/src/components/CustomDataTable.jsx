import React, { useMemo, useRef, useEffect, useCallback } from "react";
import { PropagateLoader } from "react-spinners";

// ─── Design tokens ────────────────────────────────────────────────────────────
const BRAND        = "#3169be";
const BORDER       = "#e5e7eb";
const THEAD_BG     = "#3169be";
const STRIPE_BG    = "#fafafa";
const ROW_HOVER_BG = "#f3f7fd";
const SELECTED_BG  = "#f0f5fd";

// ─── Utility: resolve "Lead_data.Email ID" style nested paths ─────────────────
function getNestedValue(obj, path) {
  if (!path) return "";
  const result = path
    .split(".")
    .reduce((acc, key) => (acc != null ? acc[key] : undefined), obj);
  return result ?? "";
}

// ─── PageButton ───────────────────────────────────────────────────────────────
const PageButton = ({ children, onClick, disabled, active }) => (
  <button
    onClick={!disabled ? onClick : undefined}
    disabled={disabled}
    style={{
      minWidth: "34px",
      height: "34px",
      padding: "0 10px",
      border: `1px solid ${active ? BRAND : BORDER}`,
      borderRadius: "7px",
      background: active ? BRAND : "#fff",
      color: active ? "#fff" : disabled ? "#d1d5db" : "#374151",
      cursor: disabled ? "not-allowed" : "pointer",
      fontSize: "13px",
      fontWeight: active ? 700 : 400,
      transition: "background 0.15s, border-color 0.15s, color 0.15s",
      userSelect: "none",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      lineHeight: 1,
      flexShrink: 0,
    }}
  >
    {children}
  </button>
);

// ─── TablePaginator ───────────────────────────────────────────────────────────
/**
 * Props:
 *  first            – zero-based offset of first visible row
 *  rows             – rows per page
 *  totalRecords     – total record count (when hasMore, parent adds +1)
 *  rowsPerPageOptions – e.g. [5, 10, 20, 50]
 *  onPageChange     – ({first, rows, page}) => void
 *  hasMore          – true  → next-page button stays enabled on last page
 *                            (token-based pagination: more data exists on server)
 */
const TablePaginator = ({
  first = 0,
  rows = 10,
  totalRecords = 0,
  rowsPerPageOptions = [5, 10, 20, 50],
  onPageChange,
  hasMore = false,
}) => {
  const currentPage = rows > 0 ? Math.floor(first / rows) : 0;
  const totalPages  = rows > 0 ? Math.max(Math.ceil(totalRecords / rows), 1) : 1;
  const isLastPage  = currentPage >= totalPages - 1;

  const goToPage = useCallback(
    (page) => {
      if (page < 0) return;
      if (page >= totalPages && !hasMore) return;
      onPageChange({ first: page * rows, rows, page });
    },
    [currentPage, totalPages, hasMore, rows, onPageChange]
  );

  // Build visible page-number buttons (max 5 around current, with ellipses)
  const pageNums = useMemo(() => {
    const total  = Math.max(totalPages, 1);
    const result = [];
    const DELTA  = 2;
    const rangeStart = Math.max(0, currentPage - DELTA);
    const rangeEnd   = Math.min(total - 1, currentPage + DELTA);

    for (let i = rangeStart; i <= rangeEnd; i++) result.push(i);

    // Prepend first page + ellipsis
    if (result[0] > 1) result.unshift("...");
    if (result[0] !== 0) result.unshift(0);

    // Append last page + ellipsis
    const last = result[result.length - 1];
    if (last < total - 2) result.push("...");
    if (last !== total - 1) result.push(total - 1);

    return result;
  }, [currentPage, totalPages]);

  // "X–Y of Z" info
  // When hasMore, parent passes totalRecords = realCount + 1; subtract that 1 for display
  const displayTotal = hasMore ? totalRecords - 1 : totalRecords;
  const from = displayTotal === 0 ? 0 : first + 1;
  const to   = Math.min(first + rows, displayTotal);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 18px",
        background: "#fff",
        borderTop: `1px solid ${BORDER}`,
        flexShrink: 0,
        gap: "12px",
        flexWrap: "wrap",
        minHeight: "54px",
      }}
    >
      {/* Rows-per-page selector */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "13px", color: "#6b7280", whiteSpace: "nowrap" }}>
          Rows per page:
        </span>
        <select
          value={rows}
          onChange={(e) =>
            onPageChange({ first: 0, rows: Number(e.target.value), page: 0 })
          }
          style={{
            border: `1px solid ${BORDER}`,
            borderRadius: "6px",
            padding: "5px 8px",
            fontSize: "13px",
            cursor: "pointer",
            outline: "none",
            color: "#374151",
            background: "#fff",
          }}
        >
          {rowsPerPageOptions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Record range label */}
      <span style={{ fontSize: "13px", color: "#6b7280", whiteSpace: "nowrap" }}>
        {displayTotal === 0
          ? "No records"
          : `${from}–${to} of ${hasMore ? `${displayTotal}+` : displayTotal}`}
      </span>

      {/* Page navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        {/* First page */}
        <PageButton onClick={() => goToPage(0)} disabled={currentPage === 0}>
          «
        </PageButton>

        {/* Previous */}
        <PageButton
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 0}
        >
          ‹
        </PageButton>

        {/* Page numbers */}
        {pageNums.map((p, i) =>
          p === "..." ? (
            <span
              key={`ellipsis-${i}`}
              style={{
                padding: "0 8px",
                color: "#9ca3af",
                fontSize: "13px",
                userSelect: "none",
                lineHeight: "34px",
              }}
            >
              …
            </span>
          ) : (
            <PageButton
              key={p}
              active={p === currentPage}
              onClick={() => goToPage(p)}
            >
              {p + 1}
            </PageButton>
          )
        )}

        {/* Next
            When hasMore is true, next is enabled even on the last page
            so the parent can auto-fetch the next token batch            */}
        <PageButton
          onClick={() => goToPage(currentPage + 1)}
          disabled={isLastPage && !hasMore}
        >
          ›
        </PageButton>

        {/* Last page */}
        <PageButton
          onClick={() => goToPage(totalPages - 1)}
          disabled={isLastPage && !hasMore}
        >
          »
        </PageButton>
      </div>
    </div>
  );
};


export default function CustomDataTable({
  // ── Core data ──────────────────────────────────────────────────────────────
  columns = [],
  data = [],
  dataKey = "id",

  // ── State ──────────────────────────────────────────────────────────────────
  loading = false,
  emptyMessage = "No records found.",

  // ── Toolbar ────────────────────────────────────────────────────────────────
  title,
  headerContent,
  actionBar,

  // ── Search ─────────────────────────────────────────────────────────────────
  showSearch = false,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search…",

  // ── Selection ──────────────────────────────────────────────────────────────
  selectable = false,
  selectedRows = [],
  onSelectionChange,

  // ── Pagination ─────────────────────────────────────────────────────────────
  first = 0,
  rows = 10,
  totalRecords = 0,
  onPageChange,
  rowsPerPageOptions = [5, 10, 20, 50],
  hasMore = false,

  // ── Layout ─────────────────────────────────────────────────────────────────
  bottomPadding = 20,
}) {
  const containerRef = useRef(null);
  const scrollRef    = useRef(null);

  // ── Dynamically fill viewport from this component's top position down ──────
  useEffect(() => {
    const updateHeight = () => {
      if (!containerRef.current) return;
      const top = containerRef.current.getBoundingClientRect().top;
      containerRef.current.style.height = `calc(100vh - ${top + bottomPadding}px)`;
    };

    updateHeight();

    const ro = new ResizeObserver(updateHeight);
    if (containerRef.current) ro.observe(document.documentElement);
    window.addEventListener("resize", updateHeight);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [bottomPadding]);

  // ── Scroll back to top whenever page changes ──────────────────────────────
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [first]);

  // ── Selection helpers ─────────────────────────────────────────────────────
  const allPageSelected =
    selectable &&
    data.length > 0 &&
    data.every((row) =>
      selectedRows.some((s) => s[dataKey] === row[dataKey])
    );

  const somePageSelected =
    selectable &&
    data.some((row) =>
      selectedRows.some((s) => s[dataKey] === row[dataKey])
    );

  const toggleSelectAll = () => {
    if (!onSelectionChange) return;
    if (allPageSelected) {
      // Deselect all rows currently on this page
      onSelectionChange(
        selectedRows.filter(
          (s) => !data.some((r) => r[dataKey] === s[dataKey])
        )
      );
    } else {
      // Add all page rows that aren't already selected
      const existing = new Set(selectedRows.map((s) => s[dataKey]));
      onSelectionChange([
        ...selectedRows,
        ...data.filter((r) => !existing.has(r[dataKey])),
      ]);
    }
  };

  const toggleSelectRow = (row) => {
    if (!onSelectionChange) return;
    const already = selectedRows.some((s) => s[dataKey] === row[dataKey]);
    onSelectionChange(
      already
        ? selectedRows.filter((s) => s[dataKey] !== row[dataKey])
        : [...selectedRows, row]
    );
  };

  const isRowSelected = (row) =>
    selectable && selectedRows.some((s) => s[dataKey] === row[dataKey]);

  // ── Checkbox ref: set indeterminate state imperatively ───────────────────
  const headerCheckboxRef = useCallback(
    (el) => {
      if (el) el.indeterminate = somePageSelected && !allPageSelected;
    },
    [somePageSelected, allPageSelected]
  );

  const showToolbar = !!(title || headerContent || actionBar || showSearch);

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection: "column",
        /* height is set dynamically by the ResizeObserver/resize listener above */
        minHeight: 0,
        background: "#fff",
        borderRadius: "12px",
        border: `1px solid ${BORDER}`,
        boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* ══════════════════════════════════════════════════════════════════
          Loading overlay – covers entire card but keeps toolbar readable
      ══════════════════════════════════════════════════════════════════ */}
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,255,255,0.78)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 30,
            borderRadius: "12px",
          }}
        >
          <PropagateLoader color={BRAND} size={14} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          Toolbar – title / tab buttons (left)  +  search / actions (right)
      ══════════════════════════════════════════════════════════════════ */}
      {showToolbar && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 18px",
            borderBottom: `1px solid ${BORDER}`,
            background: "#fff",
            flexShrink: 0,
            gap: "12px",
            flexWrap: "wrap",
            minHeight: "58px",
          }}
        >
          {/* Left slot: title and/or headerContent (e.g. PageTabs) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flex: 1,
              flexWrap: "wrap",
            }}
          >
            {title && (
              <h2
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#1f2937",
                }}
              >
                {title}
              </h2>
            )}
            {headerContent}
          </div>

          {/* Right slot: search input and/or action buttons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            {showSearch && (
              <div style={{ position: "relative" }}>
                {/* Search icon */}
                <svg
                  viewBox="0 0 24 24"
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "14px",
                    height: "14px",
                    pointerEvents: "none",
                    fill: "none",
                    stroke: "#9ca3af",
                    strokeWidth: 2.2,
                    strokeLinecap: "round",
                  }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  placeholder={searchPlaceholder}
                  style={{
                    padding: "7px 12px 7px 32px",
                    border: `1px solid ${BORDER}`,
                    borderRadius: "8px",
                    fontSize: "13px",
                    outline: "none",
                    width: "220px",
                    color: "#374151",
                    background: "#fff",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = BRAND;
                    e.target.style.boxShadow = `0 0 0 3px rgba(49, 105, 190,0.12)`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = BORDER;
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            )}

            {/* Caller-supplied buttons: Export, Delete Selected, etc. */}
            {actionBar}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          Table scroll area – flex: 1 so it fills whatever height remains
          after toolbar and paginator have taken their fixed space.
          overflow-y: auto makes only this section scroll.
      ══════════════════════════════════════════════════════════════════ */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "auto",
          minHeight: 0,
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13.5px",
          }}
        >
          {/* ── Sticky thead ──────────────────────────────────────────── */}
          <thead style={{ position: "sticky", top: 0, zIndex: 5 }}>
            <tr>
              {/* Checkbox column */}
              {selectable && (
                <th
                  style={{
                    width: "48px",
                    padding: "12px 16px",
                    background: THEAD_BG,
                    textAlign: "center",
                    borderBottom: "2px solid rgba(255,255,255,0.15)",
                  }}
                >
                  <input
                    type="checkbox"
                    ref={headerCheckboxRef}
                    checked={allPageSelected}
                    onChange={toggleSelectAll}
                    style={{
                      cursor: "pointer",
                      accentColor: "#fff",
                      width: "15px",
                      height: "15px",
                    }}
                  />
                </th>
              )}

              {/* Column headers */}
              {columns.map((col, i) => (
                <th
                  key={col.field || `col-${i}`}
                  style={{
                    padding: "12px 16px",
                    background: THEAD_BG,
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: "13px",
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    borderBottom: "2px solid rgba(255,255,255,0.15)",
                    letterSpacing: "0.3px",
                    ...(col.style || {}),
                    ...(col.headerStyle || {}),
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* ── tbody ─────────────────────────────────────────────────── */}
          <tbody>
            {data.length === 0 ? (
              /* Empty state */
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  style={{
                    textAlign: "center",
                    padding: "72px 20px",
                    color: "#9ca3af",
                    fontSize: "14px",
                  }}
                >
                  <div style={{ marginBottom: "8px", fontSize: "32px" }}>📭</div>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => {
                const selected = isRowSelected(row);
                const evenBg   = rowIdx % 2 === 0 ? "#fff" : STRIPE_BG;

                return (
                  <tr
                    key={row[dataKey] ?? rowIdx}
                    style={{
                      background: selected ? SELECTED_BG : evenBg,
                      borderBottom: `1px solid ${BORDER}`,
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) => {
                      if (!selected)
                        e.currentTarget.style.background = ROW_HOVER_BG;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = selected
                        ? SELECTED_BG
                        : evenBg;
                    }}
                  >
                    {/* Row checkbox */}
                    {selectable && (
                      <td
                        style={{
                          padding: "10px 16px",
                          textAlign: "center",
                          verticalAlign: "middle",
                        }}
                        onClick={() => toggleSelectRow(row)}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSelectRow(row)}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            cursor: "pointer",
                            accentColor: BRAND,
                            width: "15px",
                            height: "15px",
                          }}
                        />
                      </td>
                    )}

                    {/* Data cells */}
                    {columns.map((col, colIdx) => (
                      <td
                        key={col.field || `cell-${colIdx}`}
                        style={{
                          padding: "10px 16px",
                          verticalAlign: "middle",
                          color: "#374151",
                          lineHeight: "1.55",
                          ...(col.style || {}),
                        }}
                      >
                        {col.body
                          ? col.body(row, rowIdx)
                          : getNestedValue(row, col.field)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          Paginator – fixed at the bottom of the card
          Only rendered when a page-change handler is provided.
      ══════════════════════════════════════════════════════════════════ */}
      {onPageChange && (
        <TablePaginator
          first={first}
          rows={rows}
          totalRecords={totalRecords}
          rowsPerPageOptions={rowsPerPageOptions}
          onPageChange={onPageChange}
          hasMore={hasMore}
        />
      )}
    </div>
  );
}
