"use client";

// Last-resort recovery environment (1.12). Deliberately independent of
// WirdProvider: if the main store ever fails to initialize, this page must
// still inspect storage, export what's recoverable, restore a backup, or
// surgically reset damaged datasets.

import { useEffect, useRef, useState } from "react";
import {
  buildEmergencyExport,
  collectDiagnostics,
  scanDatasets,
  type DatasetReport,
  type DiagnosticsSnapshot,
} from "../lib/diagnostics";
import {
  decryptBackup,
  downloadFile,
  markBackup,
  parseBackupFile,
  previewRestore,
  restoreBackupSafe,
  unwrapDecrypted,
} from "../lib/crypto";
import { readHealth, readQuarantine, type HealthIssue, type QuarantineEntry } from "../lib/schema";

type Lang = "ar" | "en";

const STR: Record<string, { ar: string; en: string }> = {
  title: { ar: "وضع الاسترداد", en: "Recovery mode" },
  sub: {
    ar: "بيئة طوارئ: افحص التخزين، صدّر ما يمكن إنقاذه، أو استعد نسخة. لا يُحذف شيء دون تأكيد صريح.",
    en: "Emergency environment: inspect storage, export what is salvageable, or restore a backup. Nothing is deleted without explicit confirmation.",
  },
  refresh: { ar: "تحديث", en: "Refresh" },
  health: { ar: "صحة التخزين", en: "Storage health" },
  profiles: { ar: "الحسابات", en: "Profiles" },
  datasets: { ar: "مجموعات البيانات", en: "Datasets" },
  storedKeys: { ar: "مفاتيح مخزنة", en: "Stored keys" },
  quarantined: { ar: "تالفة", en: "Corrupt" },
  future: { ar: "إصدار أحدث", en: "Future version" },
  lastBackup: { ar: "آخر نسخة", en: "Last backup" },
  lastMigration: { ar: "آخر ترحيل", en: "Last migration" },
  never: { ar: "أبدًا", en: "never" },
  emergency: { ar: "تصدير طوارئ", en: "Emergency export" },
  emergencySub: {
    ar: "ملف فيه السليم + تقرير التالف + الحجر الصحي — للإنقاذ اليدوي لاحقًا.",
    en: "A file with the healthy data + corruption report + quarantine — for later manual rescue.",
  },
  restore: { ar: "استعادة نسخة", en: "Restore backup" },
  datasetsTitle: { ar: "مجموعات البيانات المخزنة", en: "Stored datasets" },
  quarantineTitle: {
    ar: "الحجر الصحي (محفوظ، لا يُحذف تلقائيًا)",
    en: "Quarantine (preserved, never auto-deleted)",
  },
  healthTitle: { ar: "سجل التشخيص", en: "Diagnostics log" },
  emptyLog: { ar: "فارغ ✓", en: "empty ✓" },
  resetSel: { ar: "إعادة تعيين المحدد", en: "Reset selected" },
  resetAll: { ar: "مسح كل شيء", en: "Erase everything" },
  back: { ar: "→ عودة", en: "→ Back" },
  ok: { ar: "سليم", en: "healthy" },
  legacy: { ar: "قديم", en: "legacy" },
  migrated: { ar: "مُرحّل", en: "migrated" },
  corrupted: { ar: "تالف", en: "corrupt" },
  futureV: { ar: "أحدث", en: "future" },
  unknownK: { ar: "غير معروف", en: "unknown" },
  profileTag: { ar: "حساب", en: "profile" },
  deviceTag: { ar: "الجهاز", en: "device" },
};

function fmtDate(at: number, lang: Lang): string {
  if (!at) return STR.never?.[lang] ?? "never";
  try {
    return new Date(at).toISOString().slice(0, 16).replace("T", " ");
  } catch {
    return "";
  }
}

export default function RecoveryPage() {
  const [lang, setLang] = useState<Lang>("ar");
  const [diag, setDiag] = useState<DiagnosticsSnapshot | null>(null);
  const [reports, setReports] = useState<DatasetReport[]>([]);
  const [quarantine, setQuarantine] = useState<QuarantineEntry[]>([]);
  const [health, setHealth] = useState<HealthIssue[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Hydration-safe: static empties match SSR; storage reads after mount.
  const refresh = () => {
    try {
      setDiag(collectDiagnostics());
    } catch {}
    try {
      setReports(scanDatasets());
    } catch {}
    try {
      setQuarantine(readQuarantine());
    } catch {}
    try {
      setHealth(readHealth());
    } catch {}
    setSelected(new Set());
  };
  useEffect(() => {
    try {
      if (typeof navigator !== "undefined" && navigator.language?.startsWith("en")) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-once locale detection (default "ar" matches SSR)
        setLang("en");
      }
    } catch {}
    refresh();
  }, []);

  const t = (k: string) => STR[k]?.[lang] ?? k;
  const stamp = () => new Date().toISOString().slice(0, 10);

  const onEmergency = () => {
    try {
      const data = buildEmergencyExport();
      downloadFile(`wird-emergency-${stamp()}.json`, JSON.stringify(data, null, 2));
      const s = data.summary;
      setMsg(
        lang === "ar"
          ? `طوارئ: سليم ${s.recovered} · تالف ${s.corrupted} · متروك ${s.skipped}`
          : `Emergency: healthy ${s.recovered} · corrupt ${s.corrupted} · skipped ${s.skipped}`,
      );
    } catch {
      setMsg(lang === "ar" ? "تعذر التصدير" : "Export failed");
    }
  };

  const onImportFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      const text = await f.text();
      let data: unknown = JSON.parse(text);
      if (data && typeof data === "object" && "enc" in (data as Record<string, unknown>)) {
        const pass = window.prompt(lang === "ar" ? "كلمة سر النسخة:" : "Backup password:");
        if (!pass) return;
        data = unwrapDecrypted(await decryptBackup(pass, text));
      } else {
        data = parseBackupFile(text);
      }
      const pre = previewRestore(data);
      if (pre.invalid > 0 || pre.salvagable > 0) {
        const warn =
          lang === "ar"
            ? `تالف ${pre.invalid} وقابل للإنقاذ ${pre.salvagable} من ${pre.total} — سيُحفظ التالف في الحجر. متابعة؟`
            : `${pre.invalid} corrupt, ${pre.salvagable} salvageable of ${pre.total} — corrupt goes to quarantine. Continue?`;
        if (!window.confirm(warn)) return;
      }
      const report = restoreBackupSafe(data);
      markBackup("import");
      setMsg(lang === "ar" ? `تمت الاستعادة (${report.applied})` : `Restored (${report.applied})`);
      refresh();
    } catch {
      setMsg(lang === "ar" ? "ملف غير صالح أو كلمة سر خاطئة" : "Invalid file or wrong password");
    }
  };

  const onResetSelected = () => {
    if (selected.size === 0) return;
    const names = [...selected].join(", ");
    const ask =
      lang === "ar"
        ? `سيُحذف ${selected.size} نهائيًا من هذا الجهاز: ${names}. لا يمكن التراجع بدون نسخة. متابعة؟`
        : `This permanently deletes ${selected.size} from this device: ${names}. No undo without a backup. Continue?`;
    try {
      if (!window.confirm(ask)) return;
    } catch {
      return;
    }
    try {
      for (const k of selected) localStorage.removeItem(k);
      // Drop their quarantine entries too — this reset is explicit.
      try {
        const q = readQuarantine();
        const kept = q.filter((e) => !selected.has(e.key));
        if (kept.length !== q.length) {
          localStorage.setItem("wird-quarantine-v1", JSON.stringify(kept.slice(-20)));
        }
      } catch {}
      setMsg(lang === "ar" ? `أُعيد تعيين ${selected.size}` : `Reset ${selected.size}`);
      refresh();
    } catch {
      setMsg(lang === "ar" ? "تعذر" : "Failed");
    }
  };

  const onResetAll = () => {
    const ask =
      lang === "ar"
        ? "سيُمسح كل شيء (كل الحسابات وكل البيانات) نهائيًا. اكتب DELETE للتأكيد:"
        : "This erases EVERYTHING (all profiles, all data) permanently. Type DELETE to confirm:";
    let typed: string | null = null;
    try {
      typed = window.prompt(ask);
    } catch {
      return;
    }
    if (typed !== "DELETE") return;
    try {
      const drop: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith("wird-") || (k.startsWith("p_") && k.includes("_wird-")))) {
          drop.push(k);
        }
      }
      for (const k of drop) localStorage.removeItem(k);
      setMsg(lang === "ar" ? "مُسح كل شيء. حدّث الصفحة." : "Everything erased. Reload the page.");
      refresh();
    } catch {
      setMsg(lang === "ar" ? "تعذر المسح" : "Erase failed");
    }
  };

  const statusLabel = (s: DatasetReport["status"]) =>
    s === "ok"
      ? t("ok")
      : s === "legacy"
        ? t("legacy")
        : s === "migrated"
          ? t("migrated")
          : s === "quarantined"
            ? t("corrupted")
            : s === "future"
              ? t("futureV")
              : t("unknownK");

  return (
    <main dir={lang === "ar" ? "rtl" : "ltr"}>
      <section className="destination-view">
        <div className="profile-hero">
          <span>🩺</span>
          <div>
            <p className="eyebrow">wird</p>
            <h2>{t("title")}</h2>
            <p>{t("sub")}</p>
          </div>
          <button type="button" onClick={() => setLang((l) => (l === "ar" ? "en" : "ar"))}>
            {lang === "ar" ? "English" : "العربية"}
          </button>
        </div>

        <article className="new-day">
          <span>📊</span>
          <div>
            <b>{t("health")}</b>
            {diag ? (
              <p className="backup-msg">
                {t("profiles")}: {diag.profiles} · {t("datasets")}: {diag.datasets} ·{" "}
                {t("storedKeys")}: {diag.storedKeys} · {t("quarantined")}: {diag.quarantinedKeys} ·{" "}
                {t("future")}: {diag.futureVersionKeys} · {t("lastBackup")}:{" "}
                {fmtDate(diag.lastBackup.at, lang)} ({diag.lastBackup.kind}) · {t("lastMigration")}:{" "}
                {fmtDate(diag.lastMigrationAt, lang)}
              </p>
            ) : (
              <p className="backup-msg">…</p>
            )}
            <div className="backup-actions">
              <button type="button" onClick={refresh}>
                {t("refresh")}
              </button>
            </div>
          </div>
        </article>

        <article className="new-day">
          <span>🚨</span>
          <div>
            <b>{t("emergency")}</b>
            <p>{t("emergencySub")}</p>
            <div className="backup-actions">
              <button type="button" onClick={onEmergency}>
                {t("emergency")}
              </button>
              <button type="button" onClick={() => fileRef.current?.click()}>
                {t("restore")}
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              hidden
              onChange={(e) => {
                void onImportFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>
        </article>

        <article className="new-day">
          <span>🧬</span>
          <div>
            <b>{t("datasetsTitle")}</b>
            {reports.map((r) => (
              <label key={r.storedKey} className="time-label" style={{ display: "flex" }}>
                <input
                  type="checkbox"
                  checked={selected.has(r.storedKey)}
                  onChange={(e) =>
                    setSelected((prev) => {
                      const next = new Set(prev);
                      if (e.target.checked) next.add(r.storedKey);
                      else next.delete(r.storedKey);
                      return next;
                    })
                  }
                />
                <span dir="ltr">
                  {r.dataset} · {r.profile ? `${t("profileTag")}:${r.profile}` : t("deviceTag")} ·{" "}
                  {statusLabel(r.status)} · ×{r.records}
                </span>
              </label>
            ))}
            <div className="backup-actions">
              <button
                type="button"
                className="danger"
                disabled={selected.size === 0}
                onClick={onResetSelected}
              >
                {t("resetSel")} ({selected.size})
              </button>
              <button type="button" className="danger" onClick={onResetAll}>
                {t("resetAll")}
              </button>
            </div>
          </div>
        </article>

        {msg && <p className="backup-msg">{msg}</p>}
        <article className="new-day">
          <span>🧪</span>
          <div>
            <b>{t("quarantineTitle")}</b>
            {quarantine.length === 0 ? (
              <p className="backup-msg">{t("emptyLog")}</p>
            ) : (
              quarantine
                .slice(-10)
                .reverse()
                .map((q, i) => (
                  <p className="backup-msg" key={`${q.at}-${i}`} dir="ltr">
                    {q.key} · {q.reason} · {fmtDate(q.at, lang)}
                  </p>
                ))
            )}
          </div>
        </article>
        <article className="new-day">
          <span>📋</span>
          <div>
            <b>{t("healthTitle")}</b>
            {health.length === 0 ? (
              <p className="backup-msg">{t("emptyLog")}</p>
            ) : (
              health
                .slice(-10)
                .reverse()
                .map((h, i) => (
                  <p className="backup-msg" key={`${h.at}-${i}`} dir="ltr">
                    {h.key} · {h.kind} · {fmtDate(h.at, lang)}
                  </p>
                ))
            )}
          </div>
        </article>
        <a href="/account">{t("back")}</a>
      </section>
    </main>
  );
}
