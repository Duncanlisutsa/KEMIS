import { useEffect, useRef, useState } from "react";

function UnitDropdown({ units, value, onChange, disabled = false, placeholder = "Select Unit" }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedUnit = units.find((u) => u.id === Number(value));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (unit) => {
    onChange(unit.id);
    setOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
      <div
        onClick={() => !disabled && setOpen((prev) => !prev)}
        style={{
          border: "1px solid #cbd5e1",
          borderRadius: "4px",
          padding: "8px 10px",
          minWidth: "220px",
          cursor: disabled ? "not-allowed" : "pointer",
          background: disabled ? "#f1f5f9" : "white",
          color: selectedUnit ? "#0f172a" : "#64748b",
          userSelect: "none",
        }}
      >
        {selectedUnit
          ? `${selectedUnit.estate_name} — ${selectedUnit.unit_number}`
          : placeholder}
      </div>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            minWidth: "260px",
            maxHeight: "220px",
            overflowY: "auto",
            background: "white",
            border: "1px solid #cbd5e1",
            borderRadius: "4px",
            boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
            zIndex: 1000,
          }}
        >
          {units.length === 0 && (
            <div style={{ padding: "10px", color: "#64748b" }}>
              No units available
            </div>
          )}

          {units.map((unit) => (
            <div
              key={unit.id}
              onClick={() => handleSelect(unit)}
              style={{
                padding: "8px 10px",
                cursor: "pointer",
                background: Number(value) === unit.id ? "#eff6ff" : "white",
                borderBottom: "1px solid #f1f5f9",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f1f5f9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  Number(value) === unit.id ? "#eff6ff" : "white";
              }}
            >
              {unit.estate_name} — {unit.unit_number}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UnitDropdown;