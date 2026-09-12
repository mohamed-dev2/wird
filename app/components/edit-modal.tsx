// EditModal: generic rename dialog for customs/goals/challenges/pledges.
// Caller owns persistence; the modal only returns the edited values (or
// null on cancel) so destructive actions stay explicit at the call site.
"use client";

import { useEffect, useState } from "react";
import { useT } from "../lib/i18n";

export type EditField = { key: string; label: string; value: string };

export function EditModal({
  title,
  fields,
  onSave,
  onClose,
  onDelete,
}: {
  title: string;
  fields: EditField[];
  onSave: (vals: Record<string, string>) => void;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const t = useT();
  const [vals, setVals] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.value])),
  );
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{title}</h3>
        {fields.map((f) => (
          <label key={f.key} className="modal-field">
            {f.label}
            <input
              value={vals[f.key] ?? ""}
              onChange={(e) => setVals((cur) => ({ ...cur, [f.key]: e.target.value }))}
              maxLength={120}
            />
          </label>
        ))}
        <div className="modal-actions">
          {onDelete && (
            <button type="button" className="danger" onClick={onDelete}>
              {t("modal.delete")}
            </button>
          )}
          <span className="modal-sp" />
          <button type="button" onClick={onClose}>
            {t("modal.cancel")}
          </button>
          <button type="button" className="primary" onClick={() => onSave(vals)}>
            {t("modal.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
