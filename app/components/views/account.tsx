"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  collectBackup,
  decryptBackup,
  downloadFile,
  encryptBackup,
  restoreBackup,
} from "../../lib/crypto";
import { DEFAULT_REMINDERS, ensurePermission, fireNotification } from "../../lib/notify";
import { buildDemo, clearDemoData, mergeHistoryDemo, saveDemoReviews } from "../../lib/demo";
import { askPrompt, dayId } from "../../lib/wird";
import { PRAYER_AR, PRAYER_ORDER, type PrayerTimes } from "../../lib/prayer";
import { useStoredState } from "../../lib/use-stored-state";
import { useT } from "../../lib/i18n";
import { useWird } from "../wird-store";
import { Transfer } from "../transfer";

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
      const data = collectBackup();
      downloadFile(`wird-backup-${stamp()}.json`, JSON.stringify({ v: 1, plain: true, data }));
      setBackupMsg(t("bk.count", { n: Object.keys(data).length }));
    } catch {
      setBackupMsg(t("bk.fail"));
    }
  };
  const onExportEnc = async () => {
    const pass = askPass(t("bk.passAsk"));
    if (!pass) return;
    try {
      const payload = await encryptBackup(pass, collectBackup());
      downloadFile(`wird-backup-enc-${stamp()}.json`, payload);
      setBackupMsg(t("bk.okEnc"));
    } catch {
      setBackupMsg(t("bk.noenc"));
    }
  };
  const onImportFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      const text = await f.text();
      let data: unknown = JSON.parse(text);
      if (data && typeof data === "object" && "enc" in (data as Record<string, unknown>)) {
        const pass = askPass(t("bk.impAsk"));
        if (!pass) return;
        data = await decryptBackup(pass, text);
      } else if (data && typeof data === "object" && "data" in (data as Record<string, unknown>)) {
        data = (data as { data: unknown }).data;
      }
      const n = restoreBackup(data);
      setBackupMsg(t("bk.restored", { n }));
    } catch {
      setBackupMsg(t("bk.bad"));
    }
  };
  const onWipe = () => {
    try {
      if (!window.confirm(t("bk.wipeAsk"))) return;
      const data = collectBackup();
      for (const k of Object.keys(data)) localStorage.removeItem(k);
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
        <button type="button" onClick={onReset}>
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
