// Private plans list (STEP 4): discreet index of the user's personal plans.
// Generic names outside opened plans, no sensitive data in URLs (selection
// is in-memory state), quick exit to a neutral screen. Create flow stays
// minimal — details live in the plan view.
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "../../lib/i18n";
import { useStoredState } from "../../lib/use-stored-state";
import { dayId } from "../../lib/wird";
import { ensurePermission, fireNotification } from "../../lib/notify";
import {
  PRIVATE_PLANS_EXCLUDE_KEY,
  PRIVATE_PLANS_KEY,
  checkedInToday,
  currentRunDays,
  newPrivatePlan,
  saveExcludeFlag,
  type PlanMode,
  type PrivatePlan,
} from "../../lib/private-plans";
import { PrivatePlanDetail, planDisplayName } from "./private-plan-detail";

export function PrivatePlansView() {
  const t = useT();
  const router = useRouter();
  const [plans, setPlans] = useStoredState<PrivatePlan[]>(PRIVATE_PLANS_KEY, []);
  const [excluded, setExcluded] = useStoredState<boolean>(PRIVATE_PLANS_EXCLUDE_KEY, false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [mode, setMode] = useState<PlanMode>("abstinence");
  const [dailyMinutes, setDailyMinutes] = useState("");
  const [weeklyMinutes, setWeeklyMinutes] = useState("");
  const [msg, setMsg] = useState("");
  const today = dayId();

  // Daily check-in reminders: generic text only, fired at most once per
  // session-day, only for plans the user explicitly enabled. The reminder
  // carries no name, count, or category (lock-screen safe).
  useEffect(() => {
    try {
      const seenKey = `pp-reminded-${today}`;
      if (sessionStorage.getItem(seenKey)) return;
      const due = plans.some((p) => p.reminder && !checkedInToday(p, today));
      if (!due) return;
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      fireNotification(t("pp.reminderTitle"), t("pp.reminderBody"), "/private-plans");
      sessionStorage.setItem(seenKey, "1");
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans.length, today]);

  const persist = (next: PrivatePlan[]) => {
    try {
      setPlans(next.slice(0, 50));
    } catch {
      setMsg(t("pp.saveFail"));
    }
  };

  const create = () => {
    const p = newPrivatePlan({ name, category, mode });
    const dm = parseInt(dailyMinutes, 10);
    const wm = parseInt(weeklyMinutes, 10);
    if (mode === "time-limit") {
      if (Number.isFinite(dm) && dm > 0) p.dailyMinutes = Math.min(1440, dm);
      if (Number.isFinite(wm) && wm > 0) p.weeklyMinutes = Math.min(10080, wm);
    }
    persist([...plans, p]);
    setName("");
    setCategory("");
    setMode("abstinence");
    setDailyMinutes("");
    setWeeklyMinutes("");
    setCreating(false);
    setSelectedId(p.id);
    setMsg(t("pp.planCreated"));
  };

  const toggleReminder = async (plan: PrivatePlan) => {
    if (!plan.reminder) {
      const ok = await ensurePermission();
      if (!ok) return;
    }
    persist(plans.map((p) => (p.id === plan.id ? { ...p, reminder: !p.reminder } : p)));
  };

  const toggleExcluded = () => {
    try {
      const next = !excluded;
      setExcluded(next);
      saveExcludeFlag(next);
    } catch {
      setMsg(t("pp.saveFail"));
    }
  };

  const selected = plans.find((p) => p.id === selectedId) ?? null;
  const selectedIndex = selected ? plans.findIndex((p) => p.id === selected.id) : -1;

  if (selected && selectedIndex >= 0) {
    return (
      <PrivatePlanDetail
        plan={selected}
        index={selectedIndex}
        onBack={() => setSelectedId(null)}
        onChange={(next) => persist(plans.map((p) => (p.id === next.id ? next : p)))}
        onDelete={() => {
          persist(plans.filter((p) => p.id !== selected.id));
          setSelectedId(null);
          setMsg(t("pp.deleted"));
        }}
        onToggleReminder={() => void toggleReminder(selected)}
      />
    );
  }

  return (
    <section className="destination-view" aria-label={t("pp.title")}>
      <div className="book-chips">
        <button type="button" className="linklike" onClick={() => router.push("/")}>
          {t("pp.quickExit")}
        </button>
      </div>
      <div className="pp-hero">
        <h2>{t("pp.title")}</h2>
        <p className="backup-msg">{t("pp.sub")}</p>
        <p className="backup-msg">{t("pp.disclaimer")}</p>
      </div>
      {msg && (
        <p className="backup-msg" aria-live="polite">
          {msg}
        </p>
      )}
      {plans.length === 0 ? (
        <>
          <p>{t("pp.empty")}</p>
          <p className="backup-msg">{t("pp.emptySub")}</p>
        </>
      ) : (
        <div className="pp-plan-list">
          {plans.map((p, i) => {
            const due = !checkedInToday(p, today);
            return (
              <div key={p.id} className="pp-plan-card">
                <button type="button" className="pp-plan-open" onClick={() => setSelectedId(p.id)}>
                  <span className="pp-plan-top">
                    <strong>{planDisplayName(t, p, i)}</strong>
                    {due ? (
                      <span className="pp-due-badge">{t("pp.due")}</span>
                    ) : (
                      <span className="pp-due-badge is-done">{t("pp.checkedIn")}</span>
                    )}
                  </span>
                  <span className="pp-run-hero">
                    {t("pp.daysFmt", { n: currentRunDays(p, today) })}
                    <span>{t("pp.currentRun")}</span>
                  </span>
                  <span className="pp-open-hint">
                    {t("pp.open")} <i aria-hidden="true">‹</i>
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      )}
      {creating ? (
        <div className="pp-card pp-create-card">
          <label>
            {t("pp.name")}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("pp.namePh")}
              maxLength={80}
            />
          </label>
          <label>
            {t("pp.category")}
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder={t("pp.categoryPh")}
              maxLength={80}
            />
          </label>
          <div className="backup-actions" role="group" aria-label={t("pp.mode")}>
            {(["abstinence", "reduction", "time-limit"] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                className="pp-chip-btn"
                onClick={() => setMode(m)}
              >
                {t(
                  m === "abstinence"
                    ? "pp.modeAbstinence"
                    : m === "reduction"
                      ? "pp.modeReduction"
                      : "pp.modeTimeLimit",
                )}
              </button>
            ))}
          </div>
          {mode === "time-limit" && (
            <>
              <label>
                {t("pp.dailyLimit")}
                <input
                  value={dailyMinutes}
                  onChange={(e) => setDailyMinutes(e.target.value)}
                  inputMode="numeric"
                  placeholder="90"
                />
              </label>
              <label>
                {t("pp.weeklyLimit")}
                <input
                  value={weeklyMinutes}
                  onChange={(e) => setWeeklyMinutes(e.target.value)}
                  inputMode="numeric"
                  placeholder="600"
                />
              </label>
            </>
          )}
          <div className="backup-actions">
            <button type="button" className="pp-btn" onClick={create}>
              {t("pp.save")}
            </button>
            <button type="button" className="linklike" onClick={() => setCreating(false)}>
              {t("pp.cancel")}
            </button>
          </div>
        </div>
      ) : (
        <div className="backup-actions">
          <button type="button" className="pp-btn" onClick={() => setCreating(true)}>
            {t("pp.create")}
          </button>
        </div>
      )}
      <div className="pp-card pp-settings-card">
        <button type="button" className="linklike" onClick={toggleExcluded} aria-pressed={excluded}>
          {excluded ? "✓ " : ""}
          {t("pp.excluded")}
        </button>
        <p className="backup-msg">{t("pp.excludedDesc")}</p>
        {plans.length > 0 && !excluded && <p className="backup-msg">{t("pp.backupWarn")}</p>}
      </div>
    </section>
  );
}
