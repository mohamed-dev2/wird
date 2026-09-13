"use client";

// ProfileScopeToggle: whole-device vs this-profile-only exports. Default is
// whole-device (backward compatible); scoped exports strip other profiles'
// keys at collection time and stamp the manifest scope for the importer.
import { useT } from "../lib/i18n";

export function ProfileScopeToggle({
  scoped,
  onChange,
}: {
  scoped: boolean;
  onChange: (v: boolean) => void;
}) {
  const t = useT();
  return (
    <label className="time-label">
      <input type="checkbox" checked={scoped} onChange={(e) => onChange(e.target.checked)} />
      {t("bk.scope")}
    </label>
  );
}
