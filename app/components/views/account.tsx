// AccountView: profile manager, backup/restore/wipe, reminders, appearance,
// transfer card, demo tools, data-health card. Every destructive action
// confirms explicitly with its consequences spelled out (see §1.18).
"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  backupFilename,
  buildBackupFile,
  collectBackup,
  collectBackupFor,
  decryptBackup,
  downloadFile,
  encryptBackup,
  logExport,
  markBackup,
  parseBackupFile,
  planProfileRemap,
  previewRestore,
  profilesInBackup,
  readExportLog,
  remapBackupProfile,
  restoreBackupSafe,
  unwrapDecrypted,
  verifyBackupIntegrity,
  wrapForEncryption,
} from "../../lib/crypto";
import { ProfileScopeToggle } from "../profile-scope";
import { DEFAULT_REMINDERS, ensurePermission, fireNotification } from "../../lib/notify";
import { buildDemo, clearDemoData, mergeHistoryDemo, saveDemoReviews } from "../../lib/demo";
import { askPrompt, dayId } from "../../lib/wird";
import { PRAYER_AR, PRAYER_ORDER, type PrayerTimes } from "../../lib/prayer";
import { useStoredState } from "../../lib/use-stored-state";
import { useT } from "../../lib/i18n";
import { useWird } from "../wird-store";
import { Transfer } from "../transfer";
import {
  getActiveProfileId,
  isWeakPin,
  loadProfiles,
  loadTravelHidden,
  saveProfiles,
  saveTravelHidden,
  sha256Hex,
} from "../../lib/profiles";
import {
  readHealth,
  readQuarantine,
  type HealthIssue,
  type QuarantineEntry,
} from "../../lib/schema";
import { collectDiagnostics, type DiagnosticsSnapshot } from "../../lib/diagnostics";

function AppearanceCard() {
  const t = useT();
  const { theme, setTheme, lang, setLang, autoLock, setAutoLock } = useWird();
  return (
    <article className="new-day">
      <span>🎨</span>
      <div>
        <b>{t("ap.t")}</b>
        <p>
          {lang === "ar" ? "اختر مظهرك ولغتك — تُحفظ على جهازك." : "Pick your theme and language."}
        </p>
        <div className="backup-actions">
          {(
            [
              ["light", t("ap.light")],
              ["dark", t("ap.dark")],
              ["oled", t("ap.oled")],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => setTheme(v)}
              aria-pressed={theme === v}
              className={theme === v ? "selected" : ""}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            aria-pressed={lang === "en"}
          >
            {lang === "ar" ? "English" : "العربية"}
          </button>
        </div>
        <div className="backup-actions">
          <span className="time-label">{t("auth.autolock")}</span>
          {[0, 5, 15, 30, 60].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setAutoLock(m)}
              aria-pressed={autoLock === m}
              className={autoLock === m ? "selected" : ""}
            >
              {m === 0 ? t("auth.never") : `${m}`}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}

function DemoCard() {
  const t = useT();
  const { allHabits } = useWird();
  const [msg, setMsg] = useState("");
  const seed = () => {
    const { history, reviews } = buildDemo(
      dayId(),
      allHabits.map((h) => h.id),
    );
    const n = mergeHistoryDemo(history);
    saveDemoReviews(reviews);
    setMsg(t("dm.ok", { n }));
  };
  const clear = () => {
    try {
      if (!window.confirm(t("dm.clearAsk"))) return;
    } catch {}
    clearDemoData();
    setMsg(t("dm.cleared"));
  };
  return (
    <article className="new-day">
      <span>🧪</span>
      <div>
        <b>{t("dm.t")}</b>
        <p>{t("dm.s")}</p>
        <div className="backup-actions">
          <button type="button" onClick={seed}>
            {t("dm.seed")}
          </button>
          <button type="button" className="danger" onClick={clear}>
            {t("dm.clear")}
          </button>
        </div>
        <p className="backup-msg">{t("dm.warn")}</p>
        {msg && <p className="backup-msg">{msg}</p>}
      </div>
    </article>
  );
}

function DataHealthCard() {
  const { lang } = useWird();
  // Hydration-safe: static empties match SSR; real values load after mount.
  const [quarantine, setQuarantine] = useState<QuarantineEntry[]>([]);
  const [health, setHealth] = useState<HealthIssue[]>([]);
  const [diag, setDiag] = useState<DiagnosticsSnapshot | null>(null);
  const refresh = () => {
    try {
      setQuarantine(readQuarantine());
    } catch {}
    try {
      setHealth(readHealth());
    } catch {}
    try {
      setDiag(collectDiagnostics());
    } catch {}
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-once hydration of diagnostics (static empties match SSR)
    refresh();
  }, []);
  const onExport = () => {
    try {
      downloadFile(
        backupFilename("wird-diagnostics-"),
        JSON.stringify(
          { exportedAt: new Date().toISOString(), summary: diag, quarantine, health },
          null,
          2,
        ),
      );
      logExport("diagnostics", quarantine.length + health.length);
    } catch {}
  };
  const onClear = () => {
    try {
      localStorage.removeItem("wird-quarantine-v1");
      localStorage.removeItem("wird-health-v1");
      setQuarantine([]);
      setHealth([]);
      setDiag(collectDiagnostics());
    } catch {}
  };
  const fmt = (at: number) => {
    try {
      return new Date(at).toISOString().slice(0, 16).replace("T", " ");
    } catch {
      return "";
    }
  };
  const fmtDate = (at: number) => {
    if (!at) return lang === "ar" ? "أبدًا" : "never";
    try {
      return new Date(at).toISOString().slice(0, 10);
    } catch {
      return "";
    }
  };
  return (
    <article className="new-day" id="data-health-card">
      <span>🩺</span>
      <div>
        <b>{lang === "ar" ? "سلامة البيانات" : "Data health"}</b>
        <p>
          {lang === "ar"
            ? `الحجر الصحي: ${quarantine.length} · سجل التشخيص: ${health.length}. لا يُحذف شيء تلقائيًا — التالف يُحفظ هنا.`
            : `Quarantine: ${quarantine.length} · Diagnostics: ${health.length}. Nothing is auto-deleted — corrupt data is kept here.`}
        </p>
        {diag && (
          <p className="backup-msg">
            {lang === "ar"
              ? `الحسابات: ${diag.profiles} · مجموعات البيانات: ${diag.datasets} · مفاتيح مخزنة: ${diag.storedKeys} · آخر نسخة: ${fmtDate(diag.lastBackup.at)} (${diag.lastBackup.kind}) · آخر ترحيل: ${fmtDate(diag.lastMigrationAt)}`
              : `Profiles: ${diag.profiles} · Datasets: ${diag.datasets} · Stored keys: ${diag.storedKeys} · Last backup: ${fmtDate(diag.lastBackup.at)} (${diag.lastBackup.kind}) · Last migration: ${fmtDate(diag.lastMigrationAt)}`}
          </p>
        )}
        {quarantine
          .slice(-5)
          .reverse()
          .map((q, i) => (
            <p className="backup-msg" key={`${q.at}-${i}`}>
              {q.key} · {q.reason} · {fmt(q.at)}
            </p>
          ))}
        <div className="backup-actions">
          <button type="button" onClick={onExport}>
            {lang === "ar" ? "تصدير التشخيص" : "Export diagnostics"}
          </button>
          <button type="button" onClick={refresh}>
            {lang === "ar" ? "تحديث" : "Refresh"}
          </button>
          {(quarantine.length > 0 || health.length > 0) && (
            <button type="button" className="danger" onClick={onClear}>
              {lang === "ar" ? "مسح السجلات" : "Clear logs"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function AccountView({ onReset }: { onReset: () => void }) {
  const [backupMsg, setBackupMsg] = useState("");
  const t = useT();
  const {
    activeProfile,
    profiles,
    switchProfile,
    deleteProfile,
    logout,
    profileName,
    intention,
    setIntention,
    toggle,
    done,
    customs,
    lang,
    hideNames,
    setHideNames,
    vaultState,
    enableVaultText,
    disableVaultText,
  } = useWird();
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [travelHidden, setTravelHidden] = useState<string[]>([]);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-once travel list (empty matches SSR)
      setTravelHidden(loadTravelHidden());
    } catch {}
  }, []);
  const toggleTravel = (id: string) => {
    setTravelHidden((cur) => {
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      try {
        saveTravelHidden(next);
      } catch {}
      return next;
    });
  };
  const askName = askPrompt;
  const [reminders, setReminders] = useStoredState("wird-reminders-v1", DEFAULT_REMINDERS);
  const [analyticsOptOut, setAnalyticsOptOut] = useStoredState("wird-analytics-optout-v1", false);
  const [prayerTimes, setPrayerTimes] = useStoredState<PrayerTimes>("wird-prayer-times-v1", {});
  const [remindMsg, setRemindMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const askPass = askPrompt;
  // Consent-log labels: what left the device, in the current language.
  const exportKindLabel = (kind: string) => {
    switch (kind) {
      case "file-plain":
        return t("bk.plain");
      case "file-enc":
        return t("bk.enc");
      case "qr":
        return t("tr.tabQr");
      case "lan":
        return t("tr.tabLan");
      case "emergency":
        return t("bk.logEm");
      case "diagnostics":
        return t("bk.logDiag");
      default:
        return kind;
    }
  };
  // Destructive backup actions on a PIN-locked profile first re-verify the
  // PIN inline (an unlocked screen in the wrong hands must not suffice).
  const [pinGate, setPinGate] = useState<null | { action: "wipe" | "export" }>(null);
  const [pinGateValue, setPinGateValue] = useState("");
  const [pinGateErr, setPinGateErr] = useState("");
  const [duressMsg, setDuressMsg] = useState("");
  const [vaultMsg, setVaultMsg] = useState("");
  const [scopedExport, setScopedExport] = useState(false);
  const [exportLog, setExportLog] = useState(() => {
    try {
      return readExportLog();
    } catch {
      return [];
    }
  });
  // Vault setup/disable: discouragement FIRST (confirm), then passphrase.
  // Both directions are explicit; forgetting means permanent loss (stated).
  const setupVaultFlow = async () => {
    try {
      if (!window.confirm(t("vault.warn"))) return;
      const pass = askPass(t("vault.passAsk"));
      if (!pass || pass.length < 4) return;
      await enableVaultText(pass);
      setVaultMsg(t("vault.lockedT"));
    } catch {
      setVaultMsg(t("vault.bad"));
    }
  };
  const disableVaultFlow = async () => {
    try {
      const pass = askPass(t("vault.passAsk"));
      if (!pass) return;
      await disableVaultText(pass);
      setVaultMsg(t("vault.disable"));
    } catch {
      setVaultMsg(t("vault.bad"));
    }
  };
  // Optional duress PIN: explained first, then set (or cleared when the
  // prompt is left empty). Must differ from the real PIN and be non-weak.
  // Success reloads via switchProfile so store state stays truthful.
  const setDuressPin = async () => {
    if (!activeProfile?.pinHash) return;
    try {
      if (!window.confirm(t("auth.duressExp"))) return;
      const raw = askName(t("auth.duressAsk"));
      if (!raw) {
        const list = loadProfiles().map((p) =>
          p.id === activeProfile.id ? { ...p, duressPinHash: null } : p,
        );
        saveProfiles(list);
        switchProfile(activeProfile.id);
        return;
      }
      const v = raw.replace(/\D/g, "");
      if (v.length < 4 || v.length > 8) {
        setDuressMsg(t("auth.pin"));
        return;
      }
      if (isWeakPin(v)) {
        setDuressMsg(t("auth.weakPin"));
        return;
      }
      if ((await sha256Hex(v)) === activeProfile.pinHash) {
        setDuressMsg(t("auth.duressSame"));
        return;
      }
      const hash = await sha256Hex(v);
      const list = loadProfiles().map((p) =>
        p.id === activeProfile.id ? { ...p, duressPinHash: hash } : p,
      );
      saveProfiles(list);
      switchProfile(activeProfile.id);
    } catch {
      setDuressMsg(t("bk.wipeFail"));
    }
  };
  const needsPin = !!activeProfile?.pinHash;
  const requestPinGate = (action: "wipe" | "export") => {
    if (!needsPin) {
      if (action === "wipe") void doWipe();
      else onExportPlain();
      return;
    }
    setPinGateErr("");
    setPinGateValue("");
    setPinGate({ action });
  };
  const confirmPinGate = async () => {
    try {
      const ok = activeProfile?.pinHash
        ? (await sha256Hex(pinGateValue.replace(/\D/g, ""))) === activeProfile.pinHash
        : true;
      if (!ok) {
        setPinGateErr(t("auth.wrongPin"));
        return;
      }
      const action = pinGate?.action;
      setPinGate(null);
      setPinGateValue("");
      if (action === "wipe") void doWipe();
      else onExportPlain();
    } catch {
      setPinGateErr(t("auth.wrongPin"));
    }
  };
  const onExportPlain = () => {
    try {
      const pid = scopedExport ? (activeProfile?.id ?? null) : null;
      const file = buildBackupFile(
        collectBackupFor(pid),
        pid ? { kind: "profile" } : { kind: "device" },
      );
      downloadFile(backupFilename("wird-backup-"), JSON.stringify(file));
      markBackup("export");
      logExport("file-plain", file.count);
      try {
        setExportLog(readExportLog());
      } catch {}
      setBackupMsg(t("bk.count", { n: file.count }));
    } catch {
      setBackupMsg(t("bk.fail"));
    }
  };
  const onExportEnc = async () => {
    const pass = askPass(t("bk.passAsk"));
    if (!pass) return;
    try {
      const pid = scopedExport ? (activeProfile?.id ?? null) : null;
      const payload = await encryptBackup(
        pass,
        wrapForEncryption(collectBackupFor(pid), pid ? { kind: "profile" } : { kind: "device" }),
      );
      downloadFile(backupFilename("wird-backup-enc-"), payload);
      markBackup("export");
      logExport("file-enc", Object.keys(collectBackupFor(pid)).length);
      try {
        setExportLog(readExportLog());
      } catch {}
      setBackupMsg(t("bk.okEnc"));
    } catch {
      setBackupMsg(t("bk.noenc"));
    }
  };
  const onImportFile = async (f: File | undefined) => {
    if (!f) return;
    // Race guard: an async decrypt + a profile switch must never commit into
    // the wrong profile — abort if the active profile changed underneath us.
    const startedProfile = getActiveProfileId();
    try {
      const text = await f.text();
      let data: unknown = JSON.parse(text);
      if (data && typeof data === "object" && "enc" in (data as Record<string, unknown>)) {
        // Encrypted: AES-GCM authentication covers integrity — no extra check.
        const pass = askPass(t("bk.impAsk"));
        if (!pass) return;
        data = unwrapDecrypted(await decryptBackup(pass, text));
      } else {
        // Plain: verify the tamper-evident checksum before trusting a byte.
        if (!verifyBackupIntegrity(data)) {
          setBackupMsg(t("bk.bad"));
          return;
        }
        data = parseBackupFile(text);
      }
      if (getActiveProfileId() !== startedProfile) {
        setBackupMsg(
          lang === "ar"
            ? "تغيّر الحساب أثناء الاستيراد — أُجهض الاستيراد."
            : "Profile changed during import — import aborted.",
        );
        return;
      }
      // Dry-run first: warn before touching storage when entries need quarantine.
      // Single foreign profile + nothing for the active one → offer a
      // retarget into the current profile (never silent, never on ambiguity).
      let remapped = false;
      try {
        const pre = previewRestore(data);
        const profs = profilesInBackup(data);
        const plan = planProfileRemap(data, getActiveProfileId());
        const profNote =
          profs.length > 1
            ? lang === "ar"
              ? ` وتشمل ${profs.length} حسابات.`
              : ` It contains ${profs.length} profiles.`
            : "";
        const remapNote = plan
          ? lang === "ar"
            ? " سيُستورد إلى هذا الحساب الحالي."
            : " It will be imported into the current profile."
          : "";
        if (pre.invalid > 0 || pre.salvagable > 0 || profs.length > 1 || plan) {
          const warn =
            lang === "ar"
              ? `الملف فيه ${pre.invalid} عنصر تالف و${pre.salvagable} قابل للإنقاذ الجزئي من أصل ${pre.total}.${profNote}${remapNote} سيُحفظ التالف في الحجر الصحي بدل حذفه. متابعة؟`
              : `Backup has ${pre.invalid} corrupt and ${pre.salvagable} partially-salvageable of ${pre.total} entries.${profNote}${remapNote} Corrupt ones go to quarantine, never deleted. Continue?`;
          if (!window.confirm(warn)) {
            setBackupMsg(t("bk.bad"));
            return;
          }
        }
        if (plan && data && typeof data === "object" && !Array.isArray(data)) {
          data = remapBackupProfile(data as Record<string, unknown>, plan.from, plan.to);
          remapped = true;
        }
      } catch {
        // preview throws only for shapes restore would also reject — fall through
      }
      const report = restoreBackupSafe(data);
      markBackup("import");
      const suffix =
        (report.skipped > 0
          ? lang === "ar"
            ? ` (تُرك ${report.skipped} في الحجر الصحي)`
            : ` (${report.skipped} quarantined)`
          : "") + (remapped ? ` (${t("bk.remapped")})` : "");
      setBackupMsg(t("bk.restored", { n: report.applied }) + suffix);
    } catch {
      setBackupMsg(t("bk.bad"));
    }
  };
  const doWipe = () => {
    try {
      if (!window.confirm(t("bk.wipeAsk"))) return;
      const data = collectBackup();
      const n = Object.keys(data).length;
      const second =
        lang === "ar"
          ? `تأكيد أخير: سيُمسح ${n} عنصرًا من هذا الجهاز نهائيًا (مع بقاء سجل التشخيص). لا يمكن التراجع بدون نسخة احتياطية. متابعة؟`
          : `Final check: this permanently erases ${n} items from this device (diagnostics log kept). No undo without a backup. Continue?`;
      if (!window.confirm(second)) return;
      for (const k of Object.keys(data)) {
        if (k === "wird-quarantine-v1" || k === "wird-health-v1") continue;
        localStorage.removeItem(k);
      }
      setBackupMsg(t("bk.wiped"));
    } catch {
      setBackupMsg(t("bk.wipeFail"));
    }
  };
  return (
    <section className="destination-view">
      <div className="profile-hero">
        <span>{activeProfile?.avatar ?? "م"}</span>
        <div>
          <p className="eyebrow">{t("ac.account")}</p>
          <h2>{profileName}</h2>
          <p>{t("side.profileSub")}</p>
        </div>
      </div>
      <article className="new-day">
        <span>👥</span>
        <div>
          <b>{t("auth.manage")}</b>
          <div className="kid-tabs">
            {profiles.map((p) => (
              <span key={p.id} className="profile-tab">
                <button
                  type="button"
                  onClick={() => {
                    if (p.id !== activeProfile?.id) switchProfile(p.id);
                  }}
                  aria-pressed={p.id === activeProfile?.id}
                  className={p.id === activeProfile?.id ? "selected" : ""}
                >
                  {p.avatar} {p.name} {p.pinHash ? "🔒" : ""}
                  {travelHidden.includes(p.id) ? ` · ${t("auth.hiddenTag")}` : ""}
                </button>
                <button
                  type="button"
                  className="linklike"
                  aria-pressed={travelHidden.includes(p.id)}
                  aria-label={t("auth.travel")}
                  title={t("auth.travel")}
                  onClick={() => toggleTravel(p.id)}
                >
                  {travelHidden.includes(p.id) ? "👁‍🗨" : "👁"}
                </button>
              </span>
            ))}
          </div>
          <div className="backup-actions">
            <button type="button" onClick={logout}>
              {t("auth.logout")}
            </button>
            {activeProfile?.pinHash && (
              <button type="button" onClick={() => void setDuressPin()}>
                {activeProfile.duressPinHash ? `✓ ${t("auth.duress")}` : t("auth.duress")}
              </button>
            )}
            {activeProfile && (
              <button
                type="button"
                className="danger"
                onClick={() => {
                  try {
                    if (window.confirm(t("auth.deleteAsk"))) deleteProfile(activeProfile.id);
                  } catch {}
                }}
              >
                {t("auth.delete")}
              </button>
            )}
          </div>
          {duressMsg && <p className="backup-msg">{duressMsg}</p>}
          {vaultMsg && <p className="backup-msg">{vaultMsg}</p>}
        </div>
      </article>
      <div className="account-list">
        {(
          [
            ["ac.niyyah", "♡"],
            ["ac.customize", "☷"],
            ["ac.qiyam", "☾"],
            ["ac.remind", "◌"],
            ["ac.privacy", "⌘"],
          ] as const
        ).map(([item, icon]) => (
          <div key={item} className="acc-row">
            <button
              type="button"
              onClick={() => setOpenRow((cur) => (cur === item ? null : item))}
              aria-expanded={openRow === item}
            >
              <span>{icon}</span>
              {t(item)}
              <i>‹</i>
            </button>
            {openRow === item && (
              <div className="row-detail">
                {item === "ac.niyyah" && (
                  <>
                    <p>{intention}</p>
                    <button
                      type="button"
                      className="linklike"
                      onClick={() => {
                        const v = askName(t("intent.ask"));
                        if (v) setIntention(v);
                      }}
                    >
                      {t("intent.edit")}
                    </button>
                  </>
                )}
                {item === "ac.customize" && (
                  <>
                    <p>
                      {customs.length} · {t("tools.custom")}
                    </p>
                    <Link href="/">{t("tools.customSub")}</Link>
                  </>
                )}
                {item === "ac.qiyam" && (
                  <>
                    <p>{t("focus.q")}</p>
                    <button type="button" className="linklike" onClick={() => toggle("witr")}>
                      {done.includes("witr") ? t("focus.logged") : t("focus.cta")}
                    </button>
                  </>
                )}
                {item === "ac.remind" && (
                  <>
                    <p>{reminders.enabled ? t("rm.on") : t("rm.off")}</p>
                    <button
                      type="button"
                      className="linklike"
                      onClick={() => setReminders((r) => ({ ...r, enabled: !r.enabled }))}
                    >
                      {reminders.enabled ? t("rm.off") : t("rm.on")}
                    </button>
                  </>
                )}
                {item === "ac.privacy" && (
                  <>
                    <p>{t("bk.s")}</p>
                    <button
                      type="button"
                      className="linklike"
                      onClick={() => setHideNames((v) => !v)}
                      aria-pressed={hideNames}
                    >
                      {hideNames ? "✓ " : ""}
                      {t("auth.hideNames")}
                    </button>
                    <button
                      type="button"
                      className="linklike"
                      onClick={() => setAnalyticsOptOut((v) => !v)}
                      aria-pressed={analyticsOptOut}
                    >
                      {analyticsOptOut ? "✓ " : ""}
                      {t("auth.pausePersonal")}
                    </button>
                    {vaultState === "off" ? (
                      <button
                        type="button"
                        className="linklike"
                        onClick={() => void setupVaultFlow()}
                      >
                        {t("vault.setup")}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="linklike"
                        onClick={() => void disableVaultFlow()}
                      >
                        {t("vault.disable")}
                      </button>
                    )}
                    <button
                      type="button"
                      className="linklike"
                      onClick={() => {
                        try {
                          document
                            .getElementById("backup-card")
                            ?.scrollIntoView({ behavior: "smooth", block: "center" });
                        } catch {}
                      }}
                    >
                      {t("bk.t")}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <article className="new-day">
        <span>☀</span>
        <div>
          <b>{t("ac.newdayT")}</b>
          <p>{t("ac.newdayS")}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            try {
              if (!window.confirm(t("ac.newdayAsk"))) return;
            } catch {}
            onReset();
          }}
        >
          {t("ac.newdayB")}
        </button>
      </article>
      <article className="new-day backup-card" id="backup-card">
        <span>🛡</span>
        <div>
          <b>{t("bk.t")}</b>
          <p>بياناتك على جهازك فقط — لا خوادم ولا حسابات. صدّر نسخة مشفرة أو استعدها متى شئت.</p>
          <div className="backup-actions">
            <ProfileScopeToggle scoped={scopedExport} onChange={setScopedExport} />
          </div>
          <div className="backup-actions">
            <button type="button" onClick={onExportEnc}>
              {t("bk.enc")}
            </button>
            <button type="button" onClick={() => requestPinGate("export")}>
              {t("bk.plain")}
            </button>
            <button type="button" onClick={() => fileRef.current?.click()}>
              {t("bk.imp")}
            </button>
            <button type="button" className="danger" onClick={() => requestPinGate("wipe")}>
              {t("bk.wipe")}
            </button>
          </div>
          {pinGate && (
            <div className="backup-actions">
              <label className="time-label">
                {t("auth.pin")}
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  spellCheck={false}
                  maxLength={8}
                  value={pinGateValue}
                  onChange={(e) => setPinGateValue(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void confirmPinGate();
                    if (e.key === "Escape") setPinGate(null);
                  }}
                />
              </label>
              <button type="button" onClick={() => void confirmPinGate()}>
                {t("auth.unlock")}
              </button>
              <button type="button" className="linklike" onClick={() => setPinGate(null)}>
                {t("cm.act.none")}
              </button>
            </div>
          )}
          {pinGateErr && <p className="backup-msg">{pinGateErr}</p>}
          {backupMsg && <p className="backup-msg">{backupMsg}</p>}
          {exportLog.length > 0 && (
            <div>
              <p className="eyebrow">{t("bk.logT")}</p>
              {exportLog
                .slice(-5)
                .reverse()
                .map((e, i) => (
                  <p className="backup-msg" key={`${e.at}-${i}`} dir="ltr">
                    {new Date(e.at).toISOString().slice(0, 10)} · {exportKindLabel(e.kind)} ·{" "}
                    {e.count}
                  </p>
                ))}
            </div>
          )}
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
      <DataHealthCard />
      <article className="new-day">
        <span>⏰</span>
        <div>
          <b>{t("rm.t")}</b>
          <p>{t("rm.s")}</p>
          <div className="backup-actions">
            <button
              type="button"
              onClick={() => setReminders((r) => ({ ...r, enabled: !r.enabled }))}
              aria-pressed={reminders.enabled}
              className={reminders.enabled ? "selected" : ""}
            >
              {reminders.enabled ? t("rm.on") : t("rm.off")}
            </button>
            <label className="time-label">
              {t("rm.bed")}
              <input
                type="time"
                value={reminders.bedtime}
                onChange={(e) =>
                  setReminders((r) => ({ ...r, bedtime: e.target.value || "22:00" }))
                }
              />
            </label>
            {(["gentle", "balanced", "strict"] as const).map((tone) => (
              <button
                key={tone}
                type="button"
                onClick={() => setReminders((r) => ({ ...r, tone }))}
                aria-pressed={reminders.tone === tone}
                className={reminders.tone === tone ? "selected" : ""}
              >
                {tone === "gentle"
                  ? t("rm.gentle")
                  : tone === "balanced"
                    ? t("rm.bal")
                    : t("rm.strict")}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                void ensurePermission().then((ok) => {
                  if (ok) {
                    fireNotification(t("rm.testT"), t("rm.testB"));
                    setRemindMsg(t("rm.sent"));
                  } else {
                    setRemindMsg(t("rm.noperm"));
                  }
                });
              }}
            >
              {t("rm.test")}
            </button>
          </div>
          {remindMsg && <p className="backup-msg">{remindMsg}</p>}
        </div>
      </article>
      <AppearanceCard />
      <Transfer />
      <DemoCard />
      <article className="new-day">
        <span>🕌</span>
        <div>
          <b>{t("pt.t")}</b>
          <p>{t("pt.s")}</p>
          <div className="prayer-times-grid">
            {PRAYER_ORDER.map((p) => (
              <label key={p} className="time-label">
                {PRAYER_AR[p] ?? p}
                <input
                  type="time"
                  value={prayerTimes[p] ?? ""}
                  onChange={(e) => setPrayerTimes((cur) => ({ ...cur, [p]: e.target.value }))}
                />
              </label>
            ))}
          </div>
        </div>
      </article>
    </section>
  );
}
