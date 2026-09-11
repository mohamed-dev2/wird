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
import { PRAYER_AR, PRAYER_ORDER, type PrayerTimes } from "../../lib/prayer";
import { useStoredState } from "../../lib/use-stored-state";

export function AccountView({ onReset }: { onReset: () => void }) {
  const [backupMsg, setBackupMsg] = useState("");
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
      setBackupMsg(`تم التصدير (${Object.keys(data).length} عنصرًا). احفظ الملف في مكان آمن.`);
    } catch {
      setBackupMsg("تعذر التصدير. تحقق من مساحة التخزين.");
    }
  };
  const onExportEnc = async () => {
    const pass = askPass("كلمة سر التشفير (احفظها — لا يمكن الاستعادة بدونها):");
    if (!pass) return;
    try {
      const payload = await encryptBackup(pass, collectBackup());
      downloadFile(`wird-backup-enc-${stamp()}.json`, payload);
      setBackupMsg("تم تصدير نسخة مشفرة (AES-GCM).");
    } catch {
      setBackupMsg("تعذر التشفير على هذا المتصفح.");
    }
  };
  const onImportFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      const text = await f.text();
      let data: unknown = JSON.parse(text);
      if (data && typeof data === "object" && "enc" in (data as Record<string, unknown>)) {
        const pass = askPass("كلمة سر النسخة المشفرة:");
        if (!pass) return;
        data = await decryptBackup(pass, text);
      } else if (data && typeof data === "object" && "data" in (data as Record<string, unknown>)) {
        data = (data as { data: unknown }).data;
      }
      const n = restoreBackup(data);
      setBackupMsg(`تمت الاستعادة (${n} عنصرًا). حدّث الصفحة لرؤية بياناتك.`);
    } catch {
      setBackupMsg("ملف غير صالح أو كلمة سر خاطئة.");
    }
  };
  const onWipe = () => {
    try {
      if (!window.confirm("مسح كل بيانات ورد من هذا الجهاز نهائيًا؟")) return;
      const data = collectBackup();
      for (const k of Object.keys(data)) localStorage.removeItem(k);
      setBackupMsg("مُسحت كل البيانات. حدّث الصفحة للبدء من جديد.");
    } catch {
      setBackupMsg("تعذر المسح.");
    }
  };
  return (
    <section className="destination-view">
      <div className="profile-hero">
        <span>م</span>
        <div>
          <p className="eyebrow">حسابي</p>
          <h2>محمد عبدالله</h2>
          <p>الحمدلله دائمًا</p>
        </div>
      </div>
      <div className="account-list">
        {[
          "نيّتي لهذا الأسبوع",
          "تخصيص عباداتي",
          "وضع قيام الليل",
          "تذكيرات رحيمة",
          "خصوصيتي وبياناتي",
        ].map((item, i) => (
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
          <b>يوم جديد، بداية جديدة</b>
          <p>يمكنك بدء صفحة جديدة بلطف متى احتجت.</p>
        </div>
        <button type="button" onClick={onReset}>
          يوم جديد
        </button>
      </article>
      <article className="new-day backup-card">
        <span>🛡</span>
        <div>
          <b>النسخ الاحتياطي والخصوصية</b>
          <p>بياناتك على جهازك فقط — لا خوادم ولا حسابات. صدّر نسخة مشفرة أو استعدها متى شئت.</p>
          <div className="backup-actions">
            <button type="button" onClick={onExportEnc}>
              تصدير مشفر
            </button>
            <button type="button" onClick={onExportPlain}>
              تصدير عادي
            </button>
            <button type="button" onClick={() => fileRef.current?.click()}>
              استيراد
            </button>
            <button type="button" className="danger" onClick={onWipe}>
              مسح الكل
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
          <b>التذكيرات المحلية</b>
          <p>تعمل على جهازك فقط — بلا خوادم. تُكتم تلقائيًا في وضع المسجد.</p>
          <div className="backup-actions">
            <button
              type="button"
              onClick={() => setReminders((r) => ({ ...r, enabled: !r.enabled }))}
              aria-pressed={reminders.enabled}
              className={reminders.enabled ? "selected" : ""}
            >
              {reminders.enabled ? "✓ مفعّلة" : "تفعيل"}
            </button>
            <label className="time-label">
              الحصاد
              <input
                type="time"
                value={reminders.bedtime}
                onChange={(e) =>
                  setReminders((r) => ({ ...r, bedtime: e.target.value || "22:00" }))
                }
              />
            </label>
            {(["gentle", "balanced", "strict"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setReminders((r) => ({ ...r, tone: t }))}
                aria-pressed={reminders.tone === t}
                className={reminders.tone === t ? "selected" : ""}
              >
                {t === "gentle" ? "لطيف" : t === "balanced" ? "متوازن" : "صارم"}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                void ensurePermission().then((ok) => {
                  if (ok) {
                    fireNotification("تجربة ناجحة 🔔", "هكذا ستصلك تذكيرات وردك.");
                    setRemindMsg("أُرسل إشعار تجريبي.");
                  } else {
                    setRemindMsg("فعّل إذن الإشعارات من المتصفح أولًا.");
                  }
                });
              }}
            >
              تجربة
            </button>
          </div>
          {remindMsg && <p className="backup-msg">{remindMsg}</p>}
        </div>
      </article>
      <article className="new-day">
        <span>🕌</span>
        <div>
          <b>مواقيت الصلاة (يدوي)</b>
          <p>تُستخدم للعد التنازلي وترتيب البطاقات الذكي. اتركها فارغة للوضع الحالي.</p>
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
