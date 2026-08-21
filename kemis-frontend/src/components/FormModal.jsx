import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
} from "@mui/material";

/**
 * FormModal
 * ---------
 * One reusable, config-driven "Add / Edit" dialog used across every
 * page in the app (Tenants, Units, Leases, Maintenance, Staff, Estates...).
 *
 * Instead of each page hand-rolling its own inline <form>, pass a
 * `fields` array describing the inputs and this component renders a
 * consistent, professional modal — same spacing, same field styling,
 * same Cancel/Save behaviour everywhere.
 *
 * Field shape:
 *   {
 *     name: string (required, matches formData key),
 *     label: string,
 *     type: "text" | "number" | "email" | "password" | "date" | "select" | "textarea" | "readonly" | "custom",
 *     required: boolean,
 *     disabled: boolean,
 *     fullWidth: boolean,        // span both grid columns
 *     placeholder: string,       // used as the empty option for selects
 *     helperText: string,
 *     options: [{ value, label }], // required when type === "select"
 *     render: (formData, onChange) => JSX  // required when type === "custom"
 *   }
 */
function FormModal({
  open,
  onClose,
  title,
  fields,
  formData,
  onChange,
  onSubmit,
  submitting = false,
  submitLabel,
  isEditing = false,
  infoPanel,
  maxWidth = "sm",
  errors = {},
}) {
  const handleSubmit = (e) => {
    e?.preventDefault?.();
    if (!submitting) onSubmit(e);
  };

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      maxWidth={maxWidth}
      fullWidth
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>{title}</DialogTitle>

        <DialogContent>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginTop: "8px",
            }}
          >
            {fields.map((field) => {
              const commonProps = {
                key: field.name,
                label: field.label,
                name: field.name,
                value: formData[field.name] ?? "",
                onChange,
                required: !!field.required,
                disabled: !!field.disabled || field.type === "readonly",
                fullWidth: true,
                error: !!errors[field.name],
                helperText: errors[field.name] || field.helperText,
                style: field.fullWidth ? { gridColumn: "1 / -1" } : undefined,
              };

              if (field.type === "select") {
                return (
                  <TextField {...commonProps} select>
                    {field.placeholder && (
                      <MenuItem value="">{field.placeholder}</MenuItem>
                    )}
                    {(field.options || []).map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                );
              }

              if (field.type === "textarea") {
                return (
                  <TextField {...commonProps} multiline minRows={3} />
                );
              }
                            // A plain full-width heading used to visually group a
              // handful of fields together (e.g. "Lease Period" above
              // the start/end date pickers). Renders no input.
              if (field.type === "section") {
                return (
                  <div
                    key={field.name || field.label}
                    style={{
                      gridColumn: "1 / -1",
                      marginTop: "4px",
                      paddingBottom: "4px",
                      borderBottom: "1px solid var(--border)",
                      fontSize: "13px",
                      fontWeight: "bold",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {field.label}
                  </div>
                );
              }

              // Escape hatch for specialised inputs (e.g. a custom
              // searchable unit dropdown) that don't fit a plain TextField.
              if (field.type === "custom") {
                return (
                  <div
                    key={field.name}
                    style={field.fullWidth ? { gridColumn: "1 / -1" } : undefined}
                  >
                    {field.label && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--text-muted)",
                          marginBottom: "4px",
                        }}
                      >
                        {field.label}
                      </div>
                    )}
                    {field.render(formData, onChange)}
                  </div>
                );
              }

              return (
                <TextField
                  {...commonProps}
                  type={field.type === "readonly" ? "text" : field.type || "text"}
                  placeholder={field.placeholder}
                  InputLabelProps={field.type === "date" ? { shrink: true } : undefined}
                  inputProps={
                    field.min !== undefined || field.max !== undefined
                      ? { min: field.min, max: field.max }
                      : undefined
                  }
                />
              );
            })}
          </div>

          {infoPanel && (
            <div
              style={{
                border: "1px solid var(--border)",
                padding: "14px 16px",
                marginTop: "18px",
                borderRadius: "8px",
                background: "var(--subtle-bg)",
                color: "var(--text)",
              }}
            >
              {infoPanel}
            </div>
          )}
        </DialogContent>

        <DialogActions style={{ padding: "16px 24px" }}>
          <Button onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? "Saving..." : submitLabel || (isEditing ? "Update" : "Add")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default FormModal;