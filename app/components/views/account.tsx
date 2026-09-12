"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  buildBackupFile,
  collectBackup,
  decryptBackup,
  downloadFile,
  encryptBackup,
  markBackup,
  parseBackupFile,
  previewRestore,
  restoreBackupSafe,
  unwrapDecrypted,
  wrapForEncryption,
} from "../../lib/crypto";
import { DEFAULT_REMINDERS, ensurePermission, fireNotification } from "../../lib/notify";
import { buildDemo, clearDemoData, mergeHistoryDemo, saveDemoReviews } from "../../lib/demo";
import { askPrompt, dayId } from "../../lib/wird";
import { PRAYER_AR, PRAYER_ORDER, type PrayerTimes } from "../../lib/prayer";
import { useStoredState } from "../../lib/use-stored-state";
import { useT } from "../../lib/i18n";
import { useWird } from "../wird-store";
import { Transfer } from "../transfer";
import { getActiveProfileId } from "../../lib/profiles";
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
  const stamp = () => new Date().toISOString().slice(0, 10);
  const onExport = () => {
    try {
      downloadFile(
        `wird-diagnostics-${stamp()}.json`,
        JSON.stringify(
          { exportedAt: new Date().toISOString(), summary: diag, quarantine, health },
          null,
          2,
        ),
      );
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
  } = useWird();
  const [openRow, setOpenRow] = useState<string | null>(null);
  const askName = askPrompt;
  const [reminders, setReminders] = useStoredState("wird-reminders-v1", DEFAULT_REMINDERS);
  const [prayerTimes, setPrayerTimes] = useStoredState<PrayerTimes>("wird-prayer-times-v1", {});
  const [remindMsg, setRemindMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const askPass = askPrompt;
  const stamp = () => new Date().toISOString().slice(0, 10);
  const onExportPlain = () => {
    try {
      const file = buildBackupFile();
      downloadFile(`wird-backup-${stamp()}.json`, JSON.stringify(file));
      markBackup("export");
      setBackupMsg(t("bk.count", { n: file.count }));
    } catch {
      setBackupMsg(t("bk.fail"));
    }
  };
  const onExportEnc = async () => {
    const pass = askPass(t("bk.passAsk"));
    if (!pass) return;
    try {
      const payload = await encryptBackup(pass, wrapForEncryption(collectBackup()));
      downloadFile(`wird-backup-enc-${stamp()}.json`, payload);
      markBackup("export");
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
        const pass = askPass(t("bk.impAsk"));
        if (!pass) return;
        data = unwrapDecrypted(await decryptBackup(pass, text));
      } else {
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
      try {
        const pre = previewRestore(data);
        if (pre.invalid > 0 || pre.salvagable > 0) {
          const warn =
            lang === "ar"
              ? `الملف فيه ${pre.invalid} عنصر تالف و${pre.salvagable} قابل للإنقاذ الجزئي من أصل ${pre.total}. سيُحفظ التالف في الحجر الصحي بدل حذفه. متابعة؟`
              : `Backup has ${pre.invalid} corrupt and ${pre.salvagable} partially-salvageable of ${pre.total} entries. Corrupt ones go to quarantine, never deleted. Continue?`;
          if (!window.confirm(warn)) {
            setBackupMsg(t("bk.bad"));
            return;
          }
        }
      } catch {
        // preview throws only for shapes restore would also reject — fall through
      }
      const report = restoreBackupSafe(data);
      markBackup("import");
      const suffix =
        report.skipped > 0
          ? lang === "ar"
            ? ` (تُرك ${report.skipped} في الحجر الصحي)`
            : ` (${report.skipped} quarantined)`
          : "";
      setBackupMsg(t("bk.restored", { n: report.applied }) + suffix);
    } catch {
      setBackupMsg(t("bk.bad"));
    }
  };
  const onWipe = () => {
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
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  if (p.id !== activeProfile?.id) switchProfile(p.id);
                }}
                aria-pressed={p.id === activeProfile?.id}
                className={p.id === activeProfile?.id ? "selected" : ""}
              >
                {p.avatar} {p.name} {p.pinHash ? "🔒" : ""}
              </button>
            ))}
          </div>
          <div className="backup-actions">
            <button type="button" onClick={logout}>
              {t("auth.logout")}
            </button>
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
            <button type="button" onClick={onExportEnc}>
              {t("bk.enc")}
            </button>
            <button type="button" onClick={onExportPlain}>
              {t("bk.plain")}
            </button>
            <button type="button" onClick={() => fileRef.current?.click()}>
              {t("bk.imp")}
            </button>
            <button type="button" className="danger" onClick={onWipe}>
              {t("bk.wipe")}
            </button>
          </div>
          {backupMsg && <p className="backup-msg">{backupMsg}</p>}
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
