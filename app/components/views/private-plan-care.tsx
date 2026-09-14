// Private-plan support + settings (STEP 4): trusted-person support,
// milestones, reasons, plan identity, reminders, deletion. Split from
// private-plan-detail.tsx alongside private-plan-tracker.tsx.
"use client";

import { useEffect, useState } from "react";
import { resolveVerse, surahNameAr, versesForTheme, type ResolvedVerse } from "../../lib/content";
import { addUnique, type PrivatePlan } from "../../lib/private-plans";
import type { Mutate, TFn } from "./private-plan-detail";

export function PlanCare({
  t,
  plan,
  mutate,
  onDelete,
  onToggleReminder,
}: {
  t: TFn;
  plan: PrivatePlan;
  mutate: Mutate;
  onDelete: () => void;
  onToggleReminder: () => void;
}) {
  return (
    <>
      <SupportSection t={t} plan={plan} mutate={mutate} />
      <MilestonesSection t={t} plan={plan} mutate={mutate} />
      <ReasonsSection t={t} plan={plan} mutate={mutate} />
      <SettingsSection t={t} plan={plan} mutate={mutate} onToggleReminder={onToggleReminder} />
      <div className="pp-danger-zone">
        <h3 className="pp-sec">{t("pp.delete")}</h3>
        <div className="pp-card">
          <div className="backup-actions">
            <button
              type="button"
              className="pp-btn-danger"
              onClick={() => {
                if (window.confirm(t("pp.deleteAsk"))) onDelete();
              }}
            >
              {t("pp.delete")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function SupportSection({ t, plan, mutate }: { t: TFn; plan: PrivatePlan; mutate: Mutate }) {
  const [trusted, setTrusted] = useState(plan.trustedPerson ?? "");
  const [verse, setVerse] = useState<ResolvedVerse | null>(null);

  // Optional supportive verse: resolved at runtime from the verified
  // bundled text; renders nothing when unresolvable (authenticity rule).
  // Rendered only while islamicSupport is on, so no reset is needed here.
  useEffect(() => {
    if (!plan.islamicSupport) return;
    let live = true;
    const ref = versesForTheme("hope")[0];
    if (!ref) return;
    void resolveVerse(ref.surah, ref.ayah).then((v) => {
      if (live) setVerse(v);
    });
    return () => {
      live = false;
    };
  }, [plan.islamicSupport]);

  return (
    <>
      <h3 className="pp-sec">{t("pp.supportTitle")}</h3>
      <div className="pp-card">
        <p className="backup-msg">{t("pp.supportDesc")}</p>
        <label>
          {t("pp.trusted")}
          <input
            value={trusted}
            onChange={(e) => setTrusted(e.target.value)}
            placeholder={t("pp.trustedPh")}
            maxLength={200}
            onBlur={() => mutate((p) => ({ ...p, trustedPerson: trusted.trim() || undefined }))}
          />
        </label>
        <p className="backup-msg">{t("pp.emergencyNote")}</p>
        <button
          type="button"
          className="linklike"
          aria-pressed={plan.islamicSupport}
          onClick={() => mutate((p) => ({ ...p, islamicSupport: !p.islamicSupport }))}
        >
          {plan.islamicSupport ? "✓ " : ""}
          {t("pp.islamic")}
        </button>
        {plan.islamicSupport && (
          <p className="backup-msg">
            {t("pp.islamicNote")}
            {verse && (
              <span className="pp-verse">
                {verse.ar} ({t("pp.verseRef", { s: surahNameAr(verse.surah), a: verse.ayah })})
              </span>
            )}
          </p>
        )}
      </div>
    </>
  );
}

function MilestonesSection({ t, plan, mutate }: { t: TFn; plan: PrivatePlan; mutate: Mutate }) {
  const [draft, setDraft] = useState("");
  return (
    <>
      <h3 className="pp-sec">{t("pp.milestones")}</h3>
      <div className="pp-card">
        <div className="pp-chip-row" aria-label={t("pp.milestones")}>
          {plan.milestones.map((m) => (
            <span key={m} className="pp-chip pp-chip-static">
              {t("pp.daysFmt", { n: m })}
            </span>
          ))}
        </div>
        <label>
          {t("pp.addMilestone")}
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            inputMode="numeric"
            placeholder={t("pp.milestonePh")}
          />
        </label>
        <div className="backup-actions">
          <button
            type="button"
            className="pp-btn"
            onClick={() => {
              const m = parseInt(draft, 10);
              if (Number.isInteger(m) && m > 0 && m <= 3650) {
                mutate((p) => ({
                  ...p,
                  milestones: [...new Set([...p.milestones, m])].sort((a, b) => a - b),
                }));
              }
              setDraft("");
            }}
          >
            {t("pp.addMilestone")}
          </button>
        </div>
      </div>
    </>
  );
}

function ReasonsSection({ t, plan, mutate }: { t: TFn; plan: PrivatePlan; mutate: Mutate }) {
  const [draft, setDraft] = useState("");
  return (
    <>
      <h3 className="pp-sec">{t("pp.reasons")}</h3>
      <div className="pp-card">
        {plan.reasons.map((r) => (
          <p key={r}>
            {r}{" "}
            <button
              type="button"
              className="linklike"
              onClick={() => mutate((p) => ({ ...p, reasons: p.reasons.filter((x) => x !== r) }))}
            >
              {t("pp.remove")}
            </button>
          </p>
        ))}
        <label>
          {t("pp.addReason")}
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("pp.reasonPh")}
            maxLength={500}
          />
        </label>
        <div className="backup-actions">
          <button
            type="button"
            className="pp-btn"
            onClick={() => {
              mutate((p) => ({ ...p, reasons: addUnique(p.reasons, draft, 50) }));
              setDraft("");
            }}
          >
            {t("pp.addReason")}
          </button>
        </div>
      </div>
    </>
  );
}

function SettingsSection({
  t,
  plan,
  mutate,
  onToggleReminder,
}: {
  t: TFn;
  plan: PrivatePlan;
  mutate: Mutate;
  onToggleReminder: () => void;
}) {
  const [editName, setEditName] = useState(plan.name);
  const [editCat, setEditCat] = useState(plan.category ?? "");
  return (
    <>
      <h3 className="pp-sec">{t("pp.name")}</h3>
      <div className="pp-card">
        <label>
          {t("pp.name")}
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder={t("pp.namePh")}
            maxLength={80}
          />
        </label>
        <label>
          {t("pp.category")}
          <input
            value={editCat}
            onChange={(e) => setEditCat(e.target.value)}
            placeholder={t("pp.categoryPh")}
            maxLength={80}
          />
        </label>
        <div className="backup-actions">
          <button
            type="button"
            className="pp-btn"
            onClick={() =>
              mutate((p) => ({
                ...p,
                name: editName.trim(),
                category: editCat.trim() || undefined,
              }))
            }
          >
            {t("pp.save")}
          </button>
        </div>
        <button
          type="button"
          className="linklike"
          aria-pressed={plan.discreet}
          onClick={() => mutate((p) => ({ ...p, discreet: !p.discreet }))}
        >
          {plan.discreet ? "✓ " : ""}
          {t("pp.discreet")}
        </button>
        <p className="backup-msg">{t("pp.discreetDesc")}</p>
        <button
          type="button"
          className="linklike"
          aria-pressed={plan.reminder}
          onClick={onToggleReminder}
        >
          {plan.reminder ? "✓ " : ""}
          {plan.reminder ? t("pp.reminderOn") : t("pp.reminderOff")}
        </button>
        <p className="backup-msg">
          {t("pp.reminder")} — {t("pp.reminderDesc")}
        </p>
      </div>
    </>
  );
}
