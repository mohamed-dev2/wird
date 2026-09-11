"use client";

import { useState, useRef } from "react";
import {
  collectBackup,
  decryptBackup,
  downloadFile,
  encryptBackup,
  restoreBackup,
} from "../../lib/crypto";
import { DEFAULT_REMINDERS, ensurePermission, fireNotification } from "../../lib/notify";
import { buildDemo, clearDemoData, mergeHistoryDemo, saveDemoReviews } from "../../lib/demo";
import { dayId } from "../../lib/wird";
import { PRAYER_AR, PRAYER_ORDER, type PrayerTimes } from "../../lib/prayer";
import { useStoredState } from "../../lib/use-stored-state";
import { useT } from "../../lib/i18n";
import { useWird } from "../wird-store";

function AppearanceCard() {
  const t = useT();
  const { theme, setTheme, lang, setLang } = useWird();
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
  const [reminders, setReminders] = useStoredState("wird-reminders-v1", DEFAULT_REMINDERS);
  const [prayerTimes, setPrayerTimes] = useStoredState<PrayerTimes>("wird-prayer-times-v1", {});
  const [remindMsg, setRemindMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const askPass = (msg: string) => {
    try {
      return window.prompt(msg)?.trim() || null;
    } catch {
      return null;
    }
  };
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
        <span>م</span>
        <div>
          <p className="eyebrow">{t("ac.account")}</p>
          <h2>محمد عبدالله</h2>
          <p>{t("side.profileSub")}</p>
        </div>
      </div>
      <div className="account-list">
        {["ac.niyyah", "ac.customize", "ac.qiyam", "ac.remind", "ac.privacy"].map((item, i) => (
          <button type="button" key={item}>
            <span>{["♡", "☷", "☾", "◌", "⌘"][i]}</span>
            {item}
            <i>‹</i>
          </button>
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
      <article className="new-day backup-card">
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
