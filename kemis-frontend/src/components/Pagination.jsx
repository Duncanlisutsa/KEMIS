function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) {
  if (totalItems === 0) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  const goTo = (page) => {
    const clamped = Math.min(Math.max(page, 1), totalPages);
    onPageChange(clamped);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "10px",
        marginTop: "15px",
      }}
    >
      <span style={{ fontSize: "13px", color: "#64748b" }}>
        Showing {start}-{end} of {totalItems}
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        {onPageSizeChange && (
          <label style={{ fontSize: "13px", color: "#64748b" }}>
            Rows per page:{" "}
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            type="button"
            onClick={() => goTo(currentPage - 1)}
            disabled={currentPage === 1}
            style={buttonStyle(currentPage === 1)}
          >
            Prev
          </button>

          <span style={{ fontSize: "13px", color: "#334155" }}>
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => goTo(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={buttonStyle(currentPage === totalPages)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

const buttonStyle = (disabled) => ({
  border: "1px solid #cbd5e1",
  background: disabled ? "#f1f5f9" : "white",
  color: disabled ? "#94a3b8" : "#1e293b",
  padding: "5px 12px",
  borderRadius: "4px",
  cursor: disabled ? "not-allowed" : "pointer",
  fontSize: "13px",
});

export default Pagination;