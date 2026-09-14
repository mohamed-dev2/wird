// Deen today view (STEP 10, ADR-007): the daily dashboard — prayers,
// quests, deeds, character, reflections, streaks, chest, and settings.
// Level-gated sections (higher levels include lower ones); every layer
// hides independently via settings while tracking keeps working. All
// mutations are pure deen.ts functions persisted with saveDeen; XP flows
// only through the idempotent ledger (double-click safe).
"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useT } from "../../lib/i18n";
import { dayId } from "../../lib/wird";
import {
  AWARENESS,
  CHARACTER,
  DEEDS,
  HARAM,
  PRAYERS,
  SPEECH,
  type AwarenessItem,
} from "../../lib/deen-catalog";
import {
  addCustom,
  addQuest,
  behaviorMetrics,
  comboOf,
  completeQuest,
  dayOf,
  defaultDeen,
  evaluateAchievements,
  gapDays,
  grantReturnXp,
  loadDeen,
  markSecretDeed,
  noteOpen,
  openChest,
  resetDeen,
  rollStreaks,
  saveDeen,
  seedDailyQuests,
  setLevel,
  setMinimumDay,
  setQuestState,
  setReflection,
  setSalah,
  setSpeech,
  toggleCharacter,
  toggleDeed,
  toggleReduce,
  type DeenLevel,
  type DeenState,
  type Quest,
  type ReflectAnswer,
} from "../../lib/deen";

const ANSWERS: ReflectAnswer[] = ["no", "yes", "unsure", "skip"];

function Section(props: { title: string; sub?: string; children: ReactNode }) {
  return (
    <section className="deen-section" aria-label={props.title}>
      <div className="section-heading">
        <div>
          <h2>{props.title}</h2>
          {props.sub && <p>{props.sub}</p>}
        </div>
      </div>
      {props.children}
    </section>
  );
}

function KindBadge({ kind, t }: { kind: AwarenessItem["kind"]; t: (k: string) => string }) {
  return <em className={`deen-kind ${kind}`}>{t(`dn.kind.${kind}`)}</em>;
}

const MARK_KEY = { done: "dn.markDone", late: "dn.markLate", missed: "dn.markMissed" } as const;

export function DeenTodayView() {
  const t = useT();
  const todayId = useMemo(() => dayId(), []);
  const [state, setState] = useState<DeenState>(() => defaultDeen());
  const [erasing, setErasing] = useState(false);
  const [newQuest, setNewQuest] = useState("");
  const [newRule, setNewRule] = useState("");
  const [newDeed, setNewDeed] = useState("");
  const [returned, setReturned] = useState(false);

  // Mount-once hydration: load → session open → seed → roll → evaluate → save.
  // Quest titles resolve through t() here so stored titles are final
  // (no second pass, no raw keys on screen).
  useEffect(() => {
    let s = loadDeen();
    const gap = s.lastOpenDay ? gapDays(s.lastOpenDay, todayId) : 0;
    s = noteOpen(s, todayId);
    if (gap >= 3) {
      s = grantReturnXp(s, todayId);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-once hydration of deen session
      setReturned(true);
    }
    s = seedDailyQuests(s, todayId, t);
    s = rollStreaks(s, todayId);
    s = evaluateAchievements(s, todayId);
    saveDeen(s);

    setState(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (fn: (s: DeenState) => DeenState) => {
    setState((cur) => {
      const next = evaluateAchievements(rollStreaks(fn(cur), todayId), todayId);
      try {
        saveDeen(next);
      } catch {}
      return next;
    });
  };

  // Streak-kind → metric label (deed/habit share the goal-activity row).
  const STREAK_LABEL: Record<string, string> = {
    salah: "dn.m.salah",
    quran: "dn.m.quran",
    reflection: "dn.m.reflect",
    deed: "dn.m.goal",
    habit: "dn.m.goal",
  };

  const day = dayOf(state, todayId);
  const combo = comboOf(state, todayId);
  const metrics = behaviorMetrics(state);
  const lvl = state.level;
  const st = state.settings;

  const salahCycle = (p: (typeof PRAYERS)[number]) => {
    const cur = day.salah[p];
    const next =
      cur === undefined ? "done" : cur === "done" ? "late" : cur === "late" ? "missed" : null;
    update((s) => setSalah(s, todayId, p, next));
  };

  const reflect = (id: string, answer: ReflectAnswer) => {
    update((s) => setSpeech(s, todayId, id, { answer }));
  };

  const questDone = (q: Quest) => update((s) => completeQuest(s, q.id, todayId));
  const questState = (q: Quest, qs: Quest["state"]) => update((s) => setQuestState(s, q.id, qs));

  const todayQuests = state.quests.filter(
    (q) => q.day === todayId || (q.custom && q.state === "active"),
  );
  const personalQuests = state.quests.filter((q) => q.custom && q.state !== "done");

  return (
    <section className="destination-view" aria-label={t("dn.title")}>
      <div className="view-hero">
        <p className="eyebrow">{t("dn.today")}</p>
        <h2>{t("dn.title")}</h2>
        <p>{t("dn.sub")}</p>
        {st.showLevels && (
          <p className="deen-level-line">
            {t("dn.level", { n: lvl })} · {t(`dn.levelName${lvl}`)}
            {lvl === 5 && <> · {t("dn.legendary")}</>}
          </p>
        )}
        {st.showXp && <p className="deen-xp-line">{t("dn.xp", { n: state.xpTotal })}</p>}
        {st.showXp && <p className="deen-note">{t("dn.xpNote")}</p>}
        {st.showCombos && combo.count >= 2 && (
          <p className="deen-combo" aria-live="polite">
            {t("dn.combo", { n: combo.count })}
          </p>
        )}
        {returned && (
          <p className="deen-return" aria-live="polite">
            {t("dn.return")} — {t("dn.returnSub")}
          </p>
        )}
      </div>

      <Section title={t("dn.progress")} sub={t("dn.levelNote")}>
        <div className="deen-levels" role="group" aria-label={t("dn.progress")}>
          {([1, 2, 3, 4, 5] as DeenLevel[]).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => update((s) => setLevel(s, n))}
              aria-pressed={lvl === n}
              className={lvl === n ? "selected" : ""}
            >
              {n} · {t(`dn.levelName${n}`)}
              <small>{t(`dn.levelAdds${n}`)}</small>
            </button>
          ))}
        </div>
        {lvl === 5 && <p className="deen-note">{t("dn.legendaryNote")}</p>}
        <label className="deen-check">
          <input
            type="checkbox"
            checked={day.minimumDay}
            onChange={(e) => update((s) => setMinimumDay(s, todayId, e.target.checked))}
          />
          {t("dn.minimum")}
        </label>
        {day.minimumDay && <p className="deen-note">{t("dn.minimumOn")}</p>}
      </Section>

      <Section title={t("dn.salah")} sub={t("dn.salahSub")}>
        <div className="deen-salah">
          {PRAYERS.map((p) => {
            const m = day.salah[p];
            return (
              <button
                key={p}
                type="button"
                onClick={() => salahCycle(p)}
                aria-pressed={m === "done" || m === "late"}
                aria-label={`${t(`dn.prayer.${p}`)}: ${m ? t(MARK_KEY[m]) : t("dn.today")}`}
                className={`deen-prayer ${m ?? "none"}`}
              >
                <b>{t(`dn.prayer.${p}`)}</b>
                <span>{m ? t(MARK_KEY[m]) : "○"}</span>
              </button>
            );
          })}
        </div>
        {Object.values(day.salah).filter(Boolean).length === 5 && (
          <p className="deen-note" aria-live="polite">
            {t("dn.salahDay")}
          </p>
        )}
      </Section>

      {lvl >= 2 && st.showQuests && (
        <Section title={t("dn.quests")} sub={t("dn.questsSub")}>
          <p className="deen-note">{t("dn.diffNote")}</p>
          <div className="deen-list">
            {todayQuests.map((q) => (
              <div key={q.id} className={`deen-row ${q.state}`}>
                <span className="deen-text">
                  <b>{q.title}</b>
                  <small>
                    {t(`dn.${q.difficulty}`)} · +{q.xp}
                  </small>
                </span>
                {q.state === "active" && (
                  <>
                    <button type="button" onClick={() => questDone(q)}>
                      {t("dn.questDone")}
                    </button>
                    <button type="button" onClick={() => questState(q, "skipped")}>
                      {t("dn.questSkip")}
                    </button>
                    <button type="button" onClick={() => questState(q, "paused")}>
                      {t("dn.questPause")}
                    </button>
                  </>
                )}
                {q.state === "paused" && (
                  <button type="button" onClick={() => questState(q, "active")}>
                    {t("dn.questResume")}
                  </button>
                )}
                {q.state !== "active" && q.state !== "paused" && <em>{t(`dn.${q.state}`)}</em>}
              </div>
            ))}
          </div>
          <div className="deen-add">
            <input
              value={newQuest}
              onChange={(e) => setNewQuest(e.target.value)}
              placeholder={t("dn.questPh")}
              aria-label={t("dn.customQuest")}
              maxLength={80}
            />
            <button
              type="button"
              onClick={() => {
                const v = newQuest.trim();
                if (!v) return;
                update((s) =>
                  addQuest(s, {
                    templateId: "custom",
                    kind: "personal",
                    title: v,
                    custom: true,
                    difficulty: "easy",
                    xp: 5,
                    day: todayId,
                  }),
                );
                setNewQuest("");
              }}
            >
              {t("dn.add")}
            </button>
          </div>
          {personalQuests.length > 0 && (
            <>
              <h3>{t("dn.personalQ")}</h3>
              <div className="deen-list">
                {personalQuests.map((q) => (
                  <div key={q.id} className={`deen-row ${q.state}`}>
                    <span className="deen-text">
                      <b>{q.title}</b>
                    </span>
                    {q.state === "active" && (
                      <button type="button" onClick={() => questDone(q)}>
                        {t("dn.questDone")}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </Section>
      )}

      {lvl >= 2 && (
        <Section title={t("dn.deeds")} sub={t("dn.deedsSub")}>
          <div className="deen-list">
            {DEEDS.map((d) => {
              const on = day.deeds.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => update((s) => toggleDeed(s, todayId, d.id))}
                  aria-pressed={on}
                  className={`deen-row ${on ? "on" : ""}`}
                >
                  <span className="deen-text">
                    <b>{t(d.nameKey)}</b>
                    <small>{t(d.descKey)}</small>
                  </span>
                  <KindBadge kind={d.kind} t={t} />
                  <span>{on ? "✓" : "○"}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => update((s) => markSecretDeed(s, todayId))}
            disabled={day.secretDeed}
            className="deen-secret"
          >
            {day.secretDeed ? t("dn.secretDone") : t("dn.secretDeed")}
          </button>
          <p className="deen-note">{t("dn.secretDeedSub")}</p>
          <div className="deen-add">
            <input
              value={newDeed}
              onChange={(e) => setNewDeed(e.target.value)}
              placeholder={t("dn.customPh")}
              aria-label={t("dn.customDeed")}
              maxLength={80}
            />
            <button
              type="button"
              onClick={() => {
                const v = newDeed.trim();
                if (!v) return;
                update((s) => addCustom(s, "deeds", v));
                setNewDeed("");
              }}
            >
              {t("dn.add")}
            </button>
          </div>
          {state.customs.deeds.map((c) => {
            const on = day.deeds.includes(`custom:${c.id}`);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => update((s) => toggleDeed(s, todayId, `custom:${c.id}`))}
                aria-pressed={on}
                className={`deen-row ${on ? "on" : ""}`}
              >
                <span className="deen-text">
                  <b>{c.label}</b>
                </span>
                <span>{on ? "✓" : "○"}</span>
              </button>
            );
          })}
        </Section>
      )}

      {lvl >= 3 && (
        <Section title={t("dn.awareness")} sub={t("dn.awarenessSub")}>
          <div className="deen-list">
            {AWARENESS.map((a) => {
              const on = day.reduce.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => update((s) => toggleReduce(s, todayId, a.id))}
                  aria-pressed={on}
                  className={`deen-row ${on ? "on" : ""}`}
                >
                  <span className="deen-text">
                    <b>{t(a.nameKey)}</b>
                    <small>{t(a.descKey)}</small>
                  </span>
                  <KindBadge kind={a.kind} t={t} />
                  <span>{on ? "✓" : "○"}</span>
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {lvl >= 3 && (
        <Section title={t("dn.haramA")} sub={t("dn.haramSub")}>
          <p className="deen-note">{t("dn.noScore")}</p>
          <div className="deen-list">
            {HARAM.map((h) => {
              const cur = day.speech[h.id]?.answer;
              return (
                <div key={h.id} className="deen-reflect">
                  <span className="deen-text">
                    <b>{t(h.nameKey)}</b>
                    <small>{t(h.descKey)}</small>
                  </span>
                  <KindBadge kind={h.kind} t={t} />
                  <p>{t("dn.reflectQ")}</p>
                  <div className="deen-answers" role="group" aria-label={t(h.nameKey)}>
                    {ANSWERS.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => reflect(h.id, a)}
                        aria-pressed={cur === a}
                        className={cur === a ? "selected" : ""}
                      >
                        {t(`dn.answer.${a}`)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {lvl >= 4 && (
        <Section title={t("dn.character")} sub={t("dn.characterSub")}>
          <div className="deen-list">
            {CHARACTER.map((c) => {
              const on = day.character.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => update((s) => toggleCharacter(s, todayId, c.id))}
                  aria-pressed={on}
                  className={`deen-row ${on ? "on" : ""}`}
                >
                  <span className="deen-text">
                    <b>{t(c.nameKey)}</b>
                    <small>{t(c.descKey)}</small>
                  </span>
                  <KindBadge kind={c.kind} t={t} />
                  <span>{on ? "✓" : "○"}</span>
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {lvl >= 4 && (
        <Section title={t("dn.speech")} sub={t("dn.speechSub")}>
          <div className="deen-list">
            {SPEECH.map((item) => {
              const cur = day.speech[item.id]?.answer;
              return (
                <div key={item.id} className="deen-reflect">
                  <span className="deen-text">
                    <b>{t(item.nameKey)}</b>
                    <small>{t(item.descKey)}</small>
                  </span>
                  <KindBadge kind={item.kind} t={t} />
                  <p>{t("dn.reflectQ")}</p>
                  <div className="deen-answers" role="group" aria-label={t(item.nameKey)}>
                    {ANSWERS.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => reflect(item.id, a)}
                        aria-pressed={cur === a}
                        className={cur === a ? "selected" : ""}
                      >
                        {t(`dn.answer.${a}`)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {lvl >= 5 && (
        <Section title={t("dn.rules")} sub={t("dn.rulesSub")}>
          <div className="deen-list">
            {state.customs.rules.map((r) => {
              const key = `rule:${r.id}`;
              const on = day.character.includes(key);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => update((s) => toggleCharacter(s, todayId, key))}
                  aria-pressed={on}
                  className={`deen-row ${on ? "on" : ""}`}
                >
                  <span className="deen-text">
                    <b>{r.label}</b>
                  </span>
                  <span>{on ? "✓" : t("dn.ruleDone")}</span>
                </button>
              );
            })}
          </div>
          <div className="deen-add">
            <input
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              placeholder={t("dn.rulePh")}
              aria-label={t("dn.addRule")}
              maxLength={80}
            />
            <button
              type="button"
              onClick={() => {
                const v = newRule.trim();
                if (!v) return;
                update((s) => addCustom(s, "rules", v));
                setNewRule("");
              }}
            >
              {t("dn.add")}
            </button>
          </div>
        </Section>
      )}

      <Section title={t("dn.reflection")} sub={t("dn.reflectionSub")}>
        <button
          type="button"
          onClick={() => update((s) => setReflection(s, todayId, !day.reflectionDone))}
          aria-pressed={day.reflectionDone}
          className={`deen-row ${day.reflectionDone ? "on" : ""}`}
        >
          <span className="deen-text">
            <b>{t("dn.reflection")}</b>
          </span>
          <span>{day.reflectionDone ? "✓" : "○"}</span>
        </button>
        <input
          value={day.reflectionNote ?? ""}
          onChange={(e) =>
            update((s) => setReflection(s, todayId, day.reflectionDone || true, e.target.value))
          }
          placeholder={t("dn.notePh")}
          aria-label={t("dn.notePh")}
          maxLength={140}
        />
        {day.reflectionDone && <p className="deen-note">{t("dn.reflectDone")}</p>}
      </Section>

      <Section title={t("dn.chest")} sub={t("dn.chestSub")}>
        <button
          type="button"
          onClick={() => update((s) => openChest(s, todayId))}
          disabled={day.chestOpened}
          className={st.calmEffects ? "deen-chest" : "deen-chest plain"}
        >
          {day.chestOpened ? t("dn.chestDone") : t("dn.openChest")}
        </button>
      </Section>

      {st.showStreaks && (
        <Section title={t("dn.streaks")} sub={t("dn.streaksSub")}>
          <div className="deen-list">
            {(["salah", "quran", "reflection", "deed", "habit"] as const).map((k) => (
              <div key={k} className="deen-row static">
                <span className="deen-text">
                  <b>{t(STREAK_LABEL[k] ?? "dn.m.goal")}</b>
                </span>
                <span>
                  {state.streaks[k].current > 0
                    ? t("dn.streakDays", { n: state.streaks[k].current })
                    : "○"}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {st.showAchievements && (
        <Section title={t("dn.achievements")} sub={t("dn.achSub")}>
          <div className="deen-list">
            {(
              [
                "first-step",
                "returned",
                "consistent",
                "reflected",
                "helpful",
                "learner",
                "disciplined",
              ] as const
            ).map((id) => {
              const earned = state.achievements[id];
              const key = `dn.ach.${id === "first-step" ? "firstStep" : id}`;
              return (
                <div key={id} className={`deen-row static ${earned ? "on" : ""}`}>
                  <span className="deen-text">
                    <b>{t(key)}</b>
                    <small>{t(`${key}D`)}</small>
                  </span>
                  <span>{earned ? `${t("dn.done")} · ${earned}` : "○"}</span>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      <Section title={t("dn.metrics")} sub={t("dn.metricsSub")}>
        <div className="deen-list">
          {(
            [
              ["salahConsistency", "dn.m.salah"],
              ["quranConsistency", "dn.m.quran"],
              ["questProgress", "dn.m.quest"],
              ["reflectionConsistency", "dn.m.reflect"],
              ["goalProgress", "dn.m.goal"],
            ] as const
          ).map(([m, k]) => (
            <div key={m} className="deen-row static">
              <span className="deen-text">
                <b>{t(k)}</b>
              </span>
              <span>
                {metrics[m]}
                {"%"}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title={t("dn.settings")} sub={t("dn.settingsSub")}>
        <div className="deen-list">
          {(
            [
              ["showXp", "dn.set.xp"],
              ["showLevels", "dn.set.levels"],
              ["showStreaks", "dn.set.streaks"],
              ["showCombos", "dn.set.combos"],
              ["showAchievements", "dn.set.ach"],
              ["showQuests", "dn.set.quests"],
              ["calmEffects", "dn.set.effects"],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="deen-check">
              <input
                type="checkbox"
                checked={state.settings[k]}
                onChange={(e) =>
                  setState((cur) => {
                    const next = { ...cur, settings: { ...cur.settings, [k]: e.target.checked } };
                    try {
                      saveDeen(next);
                    } catch {}
                    return next;
                  })
                }
              />
              {t(label)}
            </label>
          ))}
        </div>
        {!erasing ? (
          <button type="button" onClick={() => setErasing(true)} className="deen-danger">
            {t("dn.erase")}
          </button>
        ) : (
          <div className="deen-erase">
            <p>{t("dn.eraseConfirm")}</p>
            <button
              type="button"
              onClick={() => {
                resetDeen();
                setState(defaultDeen());
                setErasing(false);
              }}
              className="deen-danger"
            >
              {t("dn.erase")}
            </button>
            <button type="button" onClick={() => setErasing(false)}>
              {t("dn.cancel")}
            </button>
          </div>
        )}
      </Section>
    </section>
  );
}
