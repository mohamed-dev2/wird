// Today page (/): hero, companion card, return screen, rescue plan, habits,
// Quran/adhkar/dua/goals/challenges/pledges, night reflection, kids, qada.
// The return screen REPLACES the whole page when stage > 0 (never stacked).
// Storage reads happen only in mount effects / event handlers — never during
// render — so SSR HTML always matches (see docs/TESTING.md hydration rule).

"use client";

import { useWird } from "./components/wird-store";
import { modeLabel, MODES, prayerName, useT } from "./lib/i18n";
import { fastLabel, PRAYER_ID } from "./lib/daymode";
import { EditModal } from "./components/edit-modal";
import { NowView } from "./components/views/now";
import { PrayerArc } from "./components/prayer-arc";
import Link from "next/link";

// Inline vault unlock (locked reflections): password + button only, generic
// failure message. Session-scoped — reload locks again by design.
function VaultUnlock() {
  const t = useT();
  const { unlockVaultText } = useWird();
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  return (
    <div className="backup-actions">
      <p className="eyebrow">🔒 {t("vault.lockedT")}</p>
      <label className="time-label">
        {t("vault.passAsk")}
        <input
          type="password"
          autoComplete="new-password"
          spellCheck={false}
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const v = pass;
              setPass("");
              void unlockVaultText(v).then((ok) => setErr(ok ? "" : t("vault.bad")));
            }
          }}
        />
      </label>
      <button
        type="button"
        onClick={() => {
          const v = pass;
          setPass("");
          void unlockVaultText(v).then((ok) => setErr(ok ? "" : t("vault.bad")));
        }}
      >
        {t("vault.unlock")}
      </button>
      {err && <p className="backup-msg">{err}</p>}
    </div>
  );
}
import { CompanionCard, VerseCard } from "./components/companion";
import {
  assessUser,
  coreDeeds,
  loadGuideLog,
  logGuidance,
  rotateIndex,
  selectGuidance,
  type CompanionInput,
  type GuideLog,
} from "./lib/companion";
import { detectReturns, frictionByGroups, restartSizeEvidence } from "./lib/analytics";
import { hadithForTheme, parseVerseRef, versesForTheme } from "./lib/content";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  sections,
  extras,
  adhkar,
  askPrompt,
  duas,
  QURAN_GOAL_PAGES,
  PRAYER_NAMES,
  FAST_TYPES,
  dayId,
  diffDays,
  hijriParts,
  loadFromStorage,
  saveToStorage,
} from "./lib/wird";
import { returnStage, versesForStage } from "./lib/data/verses";
import {
  DEFAULT_REMINDERS,
  evaluateLadder,
  ensurePermission,
  fireNotification,
  ladderText,
} from "./lib/notify";
import { arDuration, nextPrayer } from "./lib/prayer";
import { loadPersonalize } from "./lib/personalize";
import { useSafeMode } from "./lib/safe-mode";
import { SafeBanner, SectionGuard } from "./components/section-error";
import { useStoredState } from "./lib/use-stored-state";

export default function TodayPage() {
  const {
    done,
    setDone,
    toggle,
    dayMode,
    setDayMode,
    focusMode,
    setFocusMode,
    showNow,
    setShowNow,
    minimumPlan,
    setMinimumPlan,
    quranSeconds,
    setQuranSeconds,
    selectedMinutes,
    setSelectedMinutes,
    quranStarted,
    setQuranStarted,
    quranPages,
    setQuranPages,
    tasbeeh,
    setTasbeeh,
    customs,
    setCustoms,
    customDuas,
    setCustomDuas,
    customGoals,
    setCustomGoals,
    intention,
    setIntention,
    remindPrayer,
    setRemindPrayer,
    forgetDone,
    setForgetDone,
    reflection,
    setReflection,
    vaultState,
    partial,
    snoozed,
    togglePartial,
    toggleSnooze,
    rampReduced,
    setRampReduced,
    qada,
    setQada,
    addQada,
    clearQada,
    removeQada,
    qadaOpen,
    fastType,
    history,
    allHabits,
    activeProfile,
    setFastType,
    breaker,
    setBreaker,
    startBreaker,
    logSlip,
    breakerCleanDays,
    challenges,
    setChallenges,
    addChallenge,
    toggleChallengeDay,
    removeChallenge,
    ramadan,
    completed,
    total,
    completedPoints,
    totalPoints,
    quranPct,
    ringDeg,
    isFriday,
    addCustom,
    addDua,
    addGoal,
    toggleGoalDone,
    editIntention,
    cycleFilter,
    passFilter,
    lang,
    filter,
    scrollToQuran,
    prayerTimes,
    mosque,
    setMosque,
  } = useWird();
  const t = useT();
  // ---- M5 local features (hydration-safe stored state) ----
  const [lastSeen] = useStoredState<string | null>("wird-lastseen-v1", null);
  const [reminders] = useStoredState("wird-reminders-v1", DEFAULT_REMINDERS);
  const [returnGone, setReturnGone] = useState(false);
  const [ladderTick, setLadderTick] = useState(0);
  const [nowTick, setNowTick] = useState(0);
  const [kids, setKids] = useStoredState<{ name: string; checks: Record<string, string[]> }[]>(
    "wird-kids-v1",
    [],
  );
  const [kidSel, setKidSel] = useState(0);
  const [pledges, setPledges] = useStoredState<
    { id: string; text: string; stake: string; checks: string[] }[]
  >("wird-pledges-v1", []);

  useEffect(() => {
    const t = dayId();
    if (lastSeen !== t) {
      // Enveloped write like everything else (a raw string would fail
      // JSON.parse on next load and spam quarantine every visit).
      saveToStorage("wird-lastseen-v1", t);
    }
  }, [lastSeen]);
  useEffect(() => {
    const id = window.setInterval(() => setNowTick((t) => t + 1), 30000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    const id = window.setInterval(() => setLadderTick((t) => t + 1), 3600000);
    return () => window.clearInterval(id);
  }, []);

  const absentDays = lastSeen ? diffDays(lastSeen, dayId()) : 0;
  const stage =
    reminders.tone === "gentle"
      ? Math.min(returnStage(absentDays), 1)
      : reminders.tone === "strict"
        ? Math.max(returnStage(absentDays), absentDays >= 3 ? 2 : 0)
        : returnStage(absentDays);

  // ---- Companion engine (§2): pure assessment, memoized, mount-gated so
  // SSR/first render stay identical (no card until after hydration). ----
  // Fatigue reads a mount-frozen log snapshot: the selection stays stable
  // for the session (no log→reselect cascade); the effect below persists
  // today's entry for FUTURE sessions only.
  const todayStr = dayId();
  const [safe, setSafe] = useSafeMode();
  const [cmReady, setCmReady] = useState(false);
  const [cmDismissed, setCmDismissed] = useState<string | null>(null);
  const [showTawbah, setShowTawbah] = useState(false);
  const [frozenLog, setFrozenLog] = useState<GuideLog | null>(null);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-once companion hydration (no card pre-mount, matches SSR)
      setFrozenLog(loadGuideLog(loadFromStorage));
    } catch {}
    setCmReady(true);
  }, []);

  const challengesDone = useMemo(() => {
    const out: { id: string; title: string; end: string }[] = [];
    for (const c of challenges) {
      if (c.checks.length < c.target) continue;
      const ms = Date.parse(`${c.start}T12:00:00Z`) + c.target * 86400000;
      if (!Number.isFinite(ms)) continue;
      const end = new Date(ms).toISOString().slice(0, 10);
      if (diffDays(end, todayStr) <= 7) out.push({ id: c.id, title: c.title, end });
    }
    return out.sort((a, b) => (a.end < b.end ? 1 : -1));
  }, [challenges, todayStr]);

  const recentReviews = useMemo(() => {
    try {
      const all = loadFromStorage<Record<string, { mood?: unknown; gratitude?: unknown }>>(
        "wird-reviews-v1",
        {},
      );
      return Object.keys(all)
        .sort()
        .slice(-5)
        .map((k) => all[k])
        .filter((r): r is { mood?: unknown; gratitude?: unknown } => !!r && typeof r === "object");
    } catch {
      return [];
    }
  }, []);

  const companionInput: CompanionInput = useMemo(() => {
    // STEP 6 privacy gate: mood/gratitude enter the engine only when the
    // user allows mood analysis (settings → personalization).
    const allowMood = loadPersonalize().analyzeMood;
    const moods = allowMood
      ? recentReviews.map((r) =>
          r.mood === "good" || r.mood === "ok" || r.mood === "low" ? r.mood : null,
        )
      : [];
    return {
      today: todayStr,
      hour: new Date().getHours(),
      isFriday,
      ramadan,
      hijriMonth: hijriParts(new Date())?.month ?? null,
      history,
      doneToday: done,
      totalToday: allHabits.length,
      lastSeen,
      createdDay: activeProfile?.created ?? null,
      commitments:
        allHabits.length + customGoals.length + challenges.length + pledges.length + qadaOpen,
      deedIds: allHabits.map((h) => h.id),
      challengesDone: challengesDone.map(({ id, title }) => ({ id, title })),
      recentMoods: moods,
      gratitudeRecent:
        allowMood &&
        recentReviews.some((r) => typeof r.gratitude === "string" && r.gratitude.trim().length > 0),
      hasKids: kids.length > 0,
    };
  }, [
    todayStr,
    isFriday,
    ramadan,
    history,
    done,
    allHabits,
    lastSeen,
    activeProfile,
    customGoals,
    challenges,
    pledges,
    qadaOpen,
    challengesDone,
    recentReviews,
    kids,
  ]);

  const assessment = useMemo(
    () => (cmReady ? assessUser(companionInput) : null),
    [cmReady, companionInput],
  );
  const rawGuidance = useMemo(
    () =>
      cmReady && assessment && frozenLog
        ? selectGuidance(assessment, companionInput, frozenLog, challengesDone[0])
        : null,
    [cmReady, assessment, companionInput, frozenLog, challengesDone],
  );
  // STEP 6 privacy gate: with habit analysis off there is no guidance card
  // at all (not a degraded one). Dashboards the user opens deliberately
  // (insights) keep working — only automatic adaptation pauses.
  const guidance = loadPersonalize().analyzeHabits ? rawGuidance : null;
  useEffect(() => {
    if (!guidance || !cmReady || !frozenLog) return;
    // Persist for future sessions; frozenLog stays untouched in-session.
    // Respects the analytics opt-out AND the personalization master switch:
    // no guide-log writes when paused.
    try {
      if (loadFromStorage("wird-analytics-optout-v1", false)) return;
      if (!loadPersonalize().master) return;
      logGuidance((k, v) => saveToStorage(k, v), frozenLog, guidance.logKind, todayStr);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps -- log once per selected guidance
  }, [guidance?.logKind]);

  const guideVerse = useMemo(() => {
    if (!guidance) return null;
    const opts = versesForTheme(guidance.theme);
    if (opts.length === 0) return null;
    return opts[rotateIndex(todayStr, guidance.theme, opts.length)] ?? null;
  }, [guidance, todayStr]);
  const guideHadith = useMemo(() => {
    if (!guidance) return null;
    const opts = hadithForTheme(guidance.theme);
    if (opts.length === 0) return null;
    return opts[rotateIndex(todayStr, `h:${guidance.theme}`, opts.length)] ?? null;
  }, [guidance, todayStr]);
  const guideCoreTitles = useMemo(() => {
    if (!guidance || guidance.action !== "core") return [];
    const ids = coreDeeds(
      history,
      allHabits.map((h) => h.id),
      todayStr,
    );
    return ids.map((id) => allHabits.find((h) => h.id === id)?.title ?? id);
  }, [guidance, history, allHabits, todayStr]);

  // Analytics → coach (AM/AN/AR): pre-break best habit + restart-size
  // evidence + evening friction, all from local history only.
  const returnContext = useMemo(() => {
    if (!guidance || !cmReady) return null;
    if (guidance.state !== "RETURNING" && guidance.state !== "REBUILDING") return null;
    const events = detectReturns(history, todayStr);
    if (events.length === 0) return null;
    const last = events[events.length - 1];
    if (!last || last.gapDays < 7) return null;
    const parts: string[] = [];
    const best = coreDeeds(
      history,
      allHabits.map((h) => h.id),
      last.returnDay,
    ).slice(0, 1);
    const bestTitle =
      best.length > 0 ? (allHabits.find((h) => h.id === best[0])?.title ?? null) : null;
    if (bestTitle) parts.push(t("cm.r.returnBest", { deed: bestTitle }));
    const ev = restartSizeEvidence(events);
    if (ev.small && ev.large && ev.small.avgCont14 > ev.large.avgCont14) {
      parts.push(t("cm.r.smallRestart"));
    }
    return parts.length > 0 ? parts.join(" ") : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- context line for the selected guidance
  }, [guidance, history, allHabits, todayStr, cmReady]);

  const eveningFriction = useMemo(() => {
    if (!guidance || guidance.action !== "rescue") return false;
    const first = sections.slice(0, 3).flatMap((s) => s.habits.map((h) => h.id));
    const second = sections.slice(3).flatMap((s) => s.habits.map((h) => h.id));
    const fr = frictionByGroups(
      history,
      [
        { label: "morning", ids: first },
        { label: "evening", ids: second },
      ],
      todayStr,
    );
    return (fr[0]?.rate ?? 1) - (fr[1]?.rate ?? 1) >= 0.2;
  }, [guidance, history, todayStr]);
  const overlayNote = useMemo(() => {
    if (!guidance || !cmReady) return null;
    if (guidance.state === "RAMADAN" || guidance.state === "FRIDAY") return null;
    if (assessment?.overlays.ramadan) return t("cm.mergeRamadan");
    if (assessment?.overlays.friday) return t("cm.mergeFriday");
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- overlay text for the selected guidance
  }, [guidance, assessment, cmReady]);

  const scrollToId = (id: string) => {
    try {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch {}
  };
  const router = useRouter();
  const handleGuideAction = (kind: string) => {
    try {
      if (kind === "rescue") scrollToId("rescue-plan");
      else if (kind === "review") router.push("/deen");
      else if (kind === "core") {
        setMinimumPlan(true);
        scrollToId("rescue-plan");
      } else if (kind === "intention") editIntention();
      else if (kind === "tawbah") setShowTawbah(true);
      else if (kind === "quran") router.push("/library");
      else if (kind === "friday") scrollToId("friday-card");
    } catch {}
  };
  const returnVerses = versesForStage(stage as 0 | 1 | 2 | 3);

  useEffect(() => {
    if (!lastSeen || mosque) return;
    // STEP 6 privacy gate: ladder nudges pause with reminders analysis.
    try {
      if (!loadPersonalize().analyzeReminders) return;
    } catch {}
    const t = dayId();
    // Enveloped like everything else (raw strings corrupt the read path).
    if (loadFromStorage("wird-notify-day-v1", "") === t) return;
    const hit = evaluateLadder(new Date(), lastSeen, t, reminders);
    if (!hit) return;
    void ensurePermission().then((ok) => {
      if (!ok) return;
      const text = ladderText(lang, hit);
      fireNotification(text.title, text.body);
      saveToStorage("wird-notify-day-v1", t);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastSeen, mosque, ladderTick]);

  const nowDate = useMemo(() => {
    void nowTick;
    return new Date();
  }, [nowTick]);
  const upcoming = useMemo(() => nextPrayer(prayerTimes, nowDate), [prayerTimes, nowDate]);
  const orderedSections = useMemo(() => {
    const hasTimes = Object.values(prayerTimes).some(Boolean);
    if (!hasTimes) return sections;
    const order = ["fajr", "dhuhr", "asr", "maghrib", "isha", "night"];
    const rank = (id: string) => {
      if (!upcoming) return order.indexOf(id);
      const ui = order.indexOf(upcoming.id);
      const si = order.indexOf(id);
      return si < 0 ? 99 : (si - ui + order.length) % order.length;
    };
    return [...sections].sort((a, b) => rank(a.id) - rank(b.id));
  }, [prayerTimes, upcoming]);

  const KID_QUESTS = ["q1", "q2", "q3", "q4", "q5"];
  const INTENT_KEYS = ["job", "craft", "benefit", "learn", "family"];
  const askName = askPrompt;
  const addKid = () => {
    const name = askName(t("kd.ask"));
    if (name) {
      setKids((cur) => [...cur, { name, checks: {} }]);
      setKidSel(kids.length);
    }
  };
  const toggleKidQuest = (qi: number) => {
    const t = dayId();
    setKids((cur) =>
      cur.map((k, i) => {
        if (i !== kidSel) return k;
        const day = k.checks[t] ?? [];
        const qid = `q${qi}`;
        return {
          ...k,
          checks: {
            ...k.checks,
            [t]: day.includes(qid) ? day.filter((x) => x !== qid) : [...day, qid],
          },
        };
      }),
    );
  };
  const addPledge = () => {
    const text = askName(t("pg.askT"));
    if (!text) return;
    const stake = askName(t("pg.askS")) ?? "";
    setPledges((cur) => [...cur, { id: `plg-${Date.now()}`, text, stake, checks: [] }]);
  };
  const togglePledge = (id: string) => {
    const t = dayId();
    setPledges((cur) =>
      cur.map((p) =>
        p.id === id
          ? {
              ...p,
              checks: p.checks.includes(t) ? p.checks.filter((d) => d !== t) : [...p.checks, t],
            }
          : p,
      ),
    );
  };
  const removePledge = (id: string) => {
    try {
      if (!window.confirm(t("pg.del"))) return;
    } catch {}
    setPledges((cur) => cur.filter((p) => p.id !== id));
  };
  type EditTarget =
    | { kind: "custom"; id: string; title: string }
    | { kind: "dua"; index: number; text: string }
    | { kind: "goal"; index: number; title: string; detail: string }
    | { kind: "challenge"; id: string; title: string }
    | { kind: "pledge"; id: string; text: string; stake: string }
    | { kind: "kid"; index: number; name: string }
    | null;
  const [editing, setEditing] = useState<EditTarget>(null);
  const editBtn = (target: Exclude<EditTarget, null>) => (
    <span
      className="mini-edit"
      role="button"
      tabIndex={0}
      aria-label={t("modal.edit")}
      onClick={(e) => {
        e.stopPropagation();
        setEditing(target);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          setEditing(target);
        }
      }}
    >
      ✎
    </span>
  );
  const saveEdit = (vals: Record<string, string>) => {
    const ed = editing;
    if (!ed) return;
    if (ed.kind === "custom" && vals.title?.trim())
      setCustoms((cur) =>
        cur.map((h) => (h.id === ed.id ? { ...h, title: (vals.title ?? "").trim() } : h)),
      );
    else if (ed.kind === "dua" && vals.text?.trim())
      setCustomDuas((cur) => cur.map((d, i) => (i === ed.index ? (vals.text ?? "").trim() : d)));
    else if (ed.kind === "goal" && vals.title?.trim())
      setCustomGoals((cur) =>
        cur.map((g, i) =>
          i === ed.index
            ? { ...g, title: (vals.title ?? "").trim(), detail: vals.detail?.trim() || g.detail }
            : g,
        ),
      );
    else if (ed.kind === "challenge" && vals.title?.trim())
      setChallenges((cur) =>
        cur.map((c) => (c.id === ed.id ? { ...c, title: (vals.title ?? "").trim() } : c)),
      );
    else if (ed.kind === "pledge")
      setPledges((cur) =>
        cur.map((p) =>
          p.id === ed.id
            ? {
                ...p,
                text: vals.text?.trim() || p.text,
                stake: vals.stake?.trim() ?? p.stake,
              }
            : p,
        ),
      );
    else if (ed.kind === "kid" && vals.name?.trim())
      setKids((cur) =>
        cur.map((k, i) => (i === ed.index ? { ...k, name: (vals.name ?? "").trim() } : k)),
      );
    setEditing(null);
  };
  const deleteEditing = () => {
    const ed = editing;
    if (!ed) return;
    if (ed.kind === "custom") {
      setCustoms((cur) => cur.filter((h) => h.id !== ed.id));
      setDone((cur) => cur.filter((id) => id !== ed.id));
    } else if (ed.kind === "dua") setCustomDuas((cur) => cur.filter((_, i) => i !== ed.index));
    else if (ed.kind === "goal") setCustomGoals((cur) => cur.filter((_, i) => i !== ed.index));
    else if (ed.kind === "challenge") setChallenges((cur) => cur.filter((c) => c.id !== ed.id));
    else if (ed.kind === "pledge") setPledges((cur) => cur.filter((p) => p.id !== ed.id));
    else if (ed.kind === "kid") setKids((cur) => cur.filter((_, i) => i !== ed.index));
    setEditing(null);
  };

  if (stage > 0 && !returnGone) {
    // Welcome-back evolves with absence depth (2.4): short / gentle reset /
    // return journey / deep restart — never the same screen, never shaming.
    const tier =
      absentDays >= 90
        ? "vlong"
        : absentDays >= 30 || stage >= 3
          ? "long"
          : stage === 2
            ? "med"
            : "short";
    return (
      <>
        <section className="return-screen">
          <span className="return-moon">🌙</span>
          <p className="eyebrow">{t("ret.absent", { n: absentDays })}</p>
          <h2>{t(`ret.${tier}T`)}</h2>
          <p>{t(`ret.${tier}S`)}</p>
          {isFriday && <p>{t("cm.mergeFriday")}</p>}
          {returnVerses.map((v, i) => {
            const p = parseVerseRef(v.ref);
            return p ? <VerseCard key={i} surah={p.surah} ayah={p.ayah} /> : null;
          })}
          {absentDays >= 14 && (
            <div className="tawbah-card">
              <h3>{t("tw.t")}</h3>
              <p>{t("tw.s")}</p>
              <div className="return-actions">
                <button
                  type="button"
                  className="review-submit"
                  onClick={() => {
                    editIntention();
                    setReturnGone(true);
                  }}
                >
                  {t("tw.intention")}
                </button>
                <button type="button" className="linklike" onClick={() => setReturnGone(true)}>
                  {t("tw.continue")}
                </button>
              </div>
            </div>
          )}
          <div className="return-actions">
            <button type="button" className="review-submit" onClick={() => setReturnGone(true)}>
              {t("ret.back")}
            </button>
            <button type="button" className="linklike" onClick={() => setReturnGone(true)}>
              {t("ret.continue")}
            </button>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {ramadan && (
        <section className="ramadan-banner">
          <span>🌙</span>
          <div>
            <b>{t("rm2.title")}</b>
            <p>{t("rm2.sub")}</p>
          </div>
          <button
            type="button"
            onClick={() => toggle("taraweeh")}
            aria-pressed={done.includes("taraweeh")}
          >
            {done.includes("taraweeh") ? t("rm2.trDone") : t("rm2.tr")}
          </button>
          <button type="button" className="soft" onClick={() => setFastType("فرض رمضان")}>
            صائم اليوم
          </button>
        </section>
      )}
      {focusMode ? (
        <section className="focus-card">
          <button type="button" onClick={() => setFocusMode(false)}>
            × إنهاء التركيز
          </button>
          <span>☾</span>
          <p className="eyebrow">{t("focus.eyebrow")}</p>
          <h2>{t("focus.q")}</h2>
          <p>{t("focus.sub")}</p>
          <button
            type="button"
            className="focus-action"
            onClick={() => toggle("witr")}
            aria-pressed={done.includes("witr")}
          >
            {done.includes("witr") ? t("focus.logged") : t("focus.cta")}
          </button>
        </section>
      ) : (
        <>
          <section className="hero">
            <div className="hero-copy">
              <span className="pill">{t("hero.pill", { mode: modeLabel(lang, dayMode) })}</span>
              <h2>{t("hero.title")}</h2>
              <p>{t("hero.progress", { c: completed, t: total })}</p>
              <div className="progress-line">
                <span
                  style={{
                    width: `${total ? Math.round((completed / total) * 100) : 0}%`,
                  }}
                />
              </div>
              <div className="hero-stats">
                <b>
                  {total ? Math.round((completed / total) * 100) : 0}%{" "}
                  <small>{t("hero.pct")}</small>
                </b>
                <b>
                  {completedPoints} / {totalPoints} <small>{t("hero.points")}</small>
                </b>
              </div>
            </div>
            <div className="hero-ring" style={{ "--ring": ringDeg } as CSSProperties}>
              <div>
                <b>{completed}</b>
                <span>{t("hero.done")}</span>
              </div>
            </div>
            <div className="hero-deco">✦</div>
          </section>
          {safe ? (
            <SafeBanner onExit={() => setSafe(false)} />
          ) : (
            cmReady &&
            guidance &&
            guidance.logKind !== cmDismissed && (
              <>
                <SectionGuard>
                  <CompanionCard
                    guidance={guidance}
                    verse={guideVerse}
                    hadith={guideHadith}
                    overlayNote={overlayNote}
                    coreTitles={guideCoreTitles}
                    contextLine={returnContext}
                    onAction={(g) => handleGuideAction(g.action)}
                    onDismiss={() => setCmDismissed(guidance.logKind)}
                  />
                </SectionGuard>
                {showTawbah && (
                  <div className="tawbah-card">
                    <h3>{t("tw.t")}</h3>
                    <p>{t("tw.s")}</p>
                    <div className="return-actions">
                      <button
                        type="button"
                        className="review-submit"
                        onClick={() => {
                          editIntention();
                          setShowTawbah(false);
                        }}
                      >
                        {t("tw.intention")}
                      </button>
                      <button
                        type="button"
                        className="linklike"
                        onClick={() => setShowTawbah(false)}
                      >
                        {t("tw.continue")}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )
          )}
          <section className="mode-bar">
            <div>
              <b>{t("mode.title")}</b>
              <small>{t("mode.sub")}</small>
            </div>
            <div>
              {MODES.map((mode) => (
                <button
                  type="button"
                  onClick={() => {
                    setDayMode(mode);
                    setMinimumPlan(mode === "busy" || mode === "travel" || mode === "sick");
                  }}
                  className={dayMode === mode ? "selected" : ""}
                  key={mode}
                >
                  {modeLabel(lang, mode)}
                </button>
              ))}
              <button
                type="button"
                className="focus-trigger"
                onClick={() => setFocusMode(true)}
                aria-label={t("mode.focus")}
              >
                {t("mode.focus")}
              </button>
            </div>
          </section>
          <section className="quick-tools">
            <button
              type="button"
              className={showNow ? "active" : ""}
              onClick={() => setShowNow(!showNow)}
              aria-pressed={showNow}
            >
              <span>◉</span>
              <b>{t("tools.now")}</b>
              <small>{t("tools.nowSub")}</small>
            </button>
            <button
              type="button"
              className={minimumPlan ? "active minimum" : ""}
              onClick={() => setMinimumPlan(!minimumPlan)}
              aria-pressed={minimumPlan}
            >
              <span>✦</span>
              <b>{t("tools.min")}</b>
              <small>{t("tools.minSub")}</small>
            </button>
            <button
              type="button"
              onClick={() => {
                setMinimumPlan(true);
                setShowNow(true);
              }}
            >
              <span>↻</span>
              <b>{t("tools.start")}</b>
              <small>{t("tools.startSub")}</small>
            </button>
            <button type="button" onClick={addCustom}>
              <span>＋</span>
              <b>{t("tools.custom")}</b>
              <small>{t("tools.customSub")}</small>
            </button>
          </section>
          <section className="rescue-plan" id="rescue-plan">
            <div className="rescue-top">
              <div>
                <p className="eyebrow">{t("rescue.eyebrow")}</p>
                <h2>{t("rescue.title")}</h2>
                <p>{t("rescue.sub")}</p>
                {cmReady && guidance?.action === "rescue" && guidance.reasonKey && (
                  <p className="cm-why">{t(guidance.reasonKey, guidance.reasonVars)}</p>
                )}
                {cmReady && eveningFriction && (
                  <p className="cm-why">
                    {t("an.eveningVs")} {t("an.makeSmall")}
                  </p>
                )}
              </div>
              <span>✦</span>
            </div>
            <div className="rescue-grid">
              <article className="one-now">
                <p className="eyebrow">{t("rescue.one")}</p>
                <h3>{t("rescue.oneTitle")}</h3>
                <p>{t("rescue.oneSub")}</p>
                <button
                  type="button"
                  onClick={() => toggle("morning")}
                  aria-pressed={done.includes("morning")}
                >
                  {done.includes("morning") ? t("rescue.oneDone") : t("rescue.oneGo")}
                </button>
              </article>
              <article className="quran-session" id="quran-session">
                <p className="eyebrow">
                  جلسة قرآن
                  {quranPages > 0 ? ` · ${quranPages} صفحات اليوم` : ""}
                </p>
                <h3>
                  {quranSeconds
                    ? `${String(Math.floor(quranSeconds / 60)).padStart(2, "0")}:${String(quranSeconds % 60).padStart(2, "0")}`
                    : quranStarted
                      ? t("rescue.quranDone")
                      : t("rescue.quranStart")}
                </h3>
                {quranStarted && !quranSeconds ? (
                  <div className="pages-ask">
                    <span>{t("rescue.quranAsk")}</span>
                    {[1, 2, 4].map((page) => (
                      <button
                        type="button"
                        onClick={() => {
                          setQuranPages((p) => p + page);
                          setQuranStarted(false);
                        }}
                        key={page}
                      >
                        +{page}
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="minutes">
                      {[5, 10, 15, 30].map((minute) => (
                        <button
                          type="button"
                          className={selectedMinutes === minute ? "selected" : ""}
                          onClick={() => setSelectedMinutes(minute)}
                          key={minute}
                        >
                          {minute} {t("rescue.min")}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="session-start"
                      onClick={() => {
                        setQuranStarted(true);
                        setQuranSeconds(selectedMinutes * 60);
                      }}
                    >
                      {quranSeconds ? t("rescue.quranLive") : t("rescue.quranBegin")}
                    </button>
                  </>
                )}
              </article>
              <article className="daily-dua">
                <p className="eyebrow">{t("dua.rE")}</p>
                <h3>{t("dua.rT")}</h3>
                <p>{t("dua.rS")}</p>
                <button
                  type="button"
                  onClick={() => toggle("daily-dua")}
                  aria-pressed={done.includes("daily-dua")}
                >
                  {done.includes("daily-dua") ? t("dua.rDone") : t("dua.rB")}
                </button>
              </article>
            </div>
            <div className="rescue-bottom">
              <div>
                <span>◷</span>
                <p>
                  <b>{t("rescue.prep")}</b>
                  <small>{t("rescue.prepSub")}</small>
                </p>
              </div>
              <button type="button" onClick={() => setFocusMode(true)}>
                وضع تركيز حتى الصلاة
              </button>
              <button
                type="button"
                className="record-prayer"
                onClick={() => toggle(`${upcoming?.id ?? "dhuhr"}-jamaa`)}
                aria-pressed={done.includes(`${upcoming?.id ?? "dhuhr"}-jamaa`)}
              >
                {done.includes(`${upcoming?.id ?? "dhuhr"}-jamaa`)
                  ? t("rescue.recorded")
                  : t("rescue.record")}
              </button>
            </div>
          </section>
          <section className="steady-grid">
            <article className="ramp-card">
              <div>
                <p className="eyebrow">{t("ramp.eyebrow")}</p>
                <h3>{rampReduced ? t("ramp.light") : t("ramp.full")}</h3>
                <p>{t("ramp.sub")}</p>
              </div>
              <div className="ramp-steps">
                <i className="done">١</i>
                <i className="done">٢</i>
                <i>٤</i>
                <i>¼</i>
              </div>
              <button
                type="button"
                onClick={() => setRampReduced((v) => !v)}
                aria-pressed={rampReduced}
              >
                {rampReduced ? t("ramp.restore") : t("ramp.ease")}
              </button>
            </article>
            <article className="intention-card">
              <span>♡</span>
              <div>
                <p className="eyebrow">{t("intent.eyebrow")}</p>
                <h3>{t("intent.q")}</h3>
                <div>
                  {INTENT_KEYS.map((item) => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => setIntention(item)}
                      aria-pressed={intention === item}
                      className={intention === item ? "selected" : ""}
                    >
                      {t(`intent.${item}`)}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          </section>
          <section className="friday-card" id="friday-card">
            <span>☾</span>
            <div>
              <p className="eyebrow">
                {t("friday.eyebrow")} {isFriday ? t("friday.now") : t("friday.soon")}
              </p>
              <h3>{isFriday ? t("friday.titleNow") : t("friday.titleSoon")}</h3>
              <div>
                {[
                  "سورة الكهف",
                  "الصلاة على النبي ﷺ",
                  "التبكير للجمعة",
                  "ساعة الدعاء",
                  "صدقة الجمعة",
                  "صلة الرحم",
                ].map((item) => (
                  <button
                    type="button"
                    onClick={() => toggle(`friday-${item}`)}
                    aria-pressed={done.includes(`friday-${item}`)}
                    className={done.includes(`friday-${item}`) ? "complete" : ""}
                    key={item}
                  >
                    {done.includes(`friday-${item}`) ? "✓ " : ""}
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <b>{done.filter((item) => item.startsWith("friday-")).length} / ٦</b>
          </section>
          <section className="utility-row">
            <article>
              <div>
                <p className="eyebrow">{t("util.fav")}</p>
                <div className="favorite-tags">
                  {["الوتر", "ورد القرآن", "أذكار الصباح", "صلة الوالدين", "الاستغفار"].map(
                    (item) => (
                      <button
                        type="button"
                        onClick={() => toggle(`fav-${item}`)}
                        aria-pressed={done.includes(`fav-${item}`)}
                        className={done.includes(`fav-${item}`) ? "fav on" : "fav"}
                        key={item}
                      >
                        {done.includes(`fav-${item}`) ? "✓ " : ""}
                        {item}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </article>
            <article className="dont-forget">
              <p className="eyebrow">{t("util.forget")}</p>
              <div>
                {[
                  "صيام قضاء · ٢٢ ربيع الأول",
                  "اتصال بالوالدين · بعد المغرب",
                  "مراجعة المحفوظات · الخميس",
                  "موعد حلقة قرآن · ١٧ سبتمبر",
                ].map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() =>
                      setForgetDone((current) =>
                        current.includes(item)
                          ? current.filter((x) => x !== item)
                          : [...current, item],
                      )
                    }
                    aria-pressed={forgetDone.includes(item)}
                    className={forgetDone.includes(item) ? "done" : ""}
                  >
                    {forgetDone.includes(item) ? "✓" : "○"} {item}
                  </button>
                ))}
              </div>
            </article>
            <article className="tawbah">
              <p className="eyebrow">{t("util.tawbah")}</p>
              <b>{t("util.tawbahNeed")}</b>
              <button
                type="button"
                onClick={() => toggle("tawbah")}
                aria-pressed={done.includes("tawbah")}
              >
                {done.includes("tawbah") ? t("util.tawbahDone") : t("util.tawbahGo")}
              </button>
            </article>
          </section>
          <section className="struggle-grid">
            <article className="qada-card">
              <p className="eyebrow">{t("qd.title")}</p>
              <h3>{qadaOpen === 0 ? t("qd.empty") : t("qd.open", { n: qadaOpen })}</h3>
              <div className="qada-add">
                {PRAYER_NAMES.map((p) => (
                  <button key={p} type="button" onClick={() => addQada(p)}>
                    + {prayerName(lang, PRAYER_ID[p] ?? p)}
                  </button>
                ))}
              </div>
              {qada
                .filter((q) => !q.cleared)
                .slice(-4)
                .map((q) => (
                  <div key={q.id} className="qada-row">
                    <span>
                      {q.label} · {q.day}
                    </span>
                    <button type="button" onClick={() => clearQada(q.id)}>
                      قضيتها ✓
                    </button>
                    <button
                      type="button"
                      className="linklike"
                      onClick={() => removeQada(q.id)}
                      aria-label={t("qd.delAria")}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              {qada.some((q) => q.cleared) && (
                <button
                  type="button"
                  className="linklike"
                  onClick={() => setQada((c) => c.filter((q) => !q.cleared))}
                >
                  {t("qd.clearDone")}
                </button>
              )}
            </article>
            <article className="fast-card">
              <p className="eyebrow">{t("fs.title")}</p>
              <h3>{fastType ? fastLabel(lang, fastType) : t("fs.off")}</h3>
              <div className="fast-types">
                {FAST_TYPES.map((f) => (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={fastType === f}
                    className={fastType === f ? "selected" : ""}
                    onClick={() => setFastType((cur) => (cur === f ? null : f))}
                  >
                    {fastLabel(lang, f)}
                  </button>
                ))}
              </div>
            </article>
            <article className="breaker-card">
              <p className="eyebrow">{t("br.title")}</p>
              {!breaker ? (
                <>
                  <h3>{t("br.pick")}</h3>
                  <button type="button" onClick={startBreaker}>
                    + ابدأ التحدي
                  </button>
                </>
              ) : (
                <>
                  <h3>
                    {breaker.name} — {breakerCleanDays} يوم نظيف 🔥
                  </h3>
                  <p>
                    {t("br.slips")}: {breaker.slips.length}
                  </p>
                  <div className="breaker-actions">
                    <button type="button" onClick={logSlip}>
                      سجل زلة (واستغفر)
                    </button>
                    <button
                      type="button"
                      className="linklike"
                      onClick={() => {
                        try {
                          if (window.confirm(t("br.delAsk"))) setBreaker(null);
                        } catch {
                          setBreaker(null);
                        }
                      }}
                    >
                      إنهاء
                    </button>
                  </div>
                </>
              )}
            </article>
          </section>
          <section className="kids-card">
            <span>🧒</span>
            <div>
              <p className="eyebrow">{t("kd.title")}</p>
              {kids.length === 0 ? (
                <>
                  <h3>{t("kd.emptyT")}</h3>
                  <p>{t("kd.emptyS")}</p>
                </>
              ) : (
                <>
                  <div className="kid-tabs">
                    {kids.map((k, i) => (
                      <button
                        key={k.name + i}
                        type="button"
                        onClick={() => setKidSel(i)}
                        aria-pressed={kidSel === i}
                        className={kidSel === i ? "selected" : ""}
                      >
                        {k.name}
                      </button>
                    ))}
                    <button type="button" className="linklike" onClick={addKid}>
                      +
                    </button>
                    {kids[kidSel] && (
                      <button
                        type="button"
                        className="linklike"
                        aria-label={t("modal.edit")}
                        onClick={() => {
                          const k = kids[kidSel];
                          if (k) setEditing({ kind: "kid", index: kidSel, name: k.name });
                        }}
                      >
                        ✎
                      </button>
                    )}
                  </div>
                  {kids[kidSel] && (
                    <div className="kid-quests">
                      {KID_QUESTS.map((q, qi) => {
                        const qid = `q${qi}`;
                        const dayChecks = kids[kidSel]?.checks[dayId()] ?? [];
                        const on = dayChecks.includes(qid);
                        return (
                          <button
                            key={qid}
                            type="button"
                            onClick={() => toggleKidQuest(qi)}
                            aria-pressed={on}
                            className={on ? "kid-done" : ""}
                          >
                            {on ? "★" : "☆"} {t(`kd.${q}`)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
            {kids.length === 0 && (
              <button type="button" onClick={addKid}>
                + أضف صغيرًا
              </button>
            )}
          </section>
          {showNow && (
            <NowView
              done={done}
              toggle={toggle}
              partial={partial}
              snoozed={snoozed}
              onPartial={togglePartial}
              onSnooze={toggleSnooze}
              onAdd={addCustom}
            />
          )}{" "}
          {minimumPlan && (
            <div className="minimum-note">
              <span>✦</span>
              <div>
                <b>{t("minplan.title")}</b>
                <p>{t("minplan.sub")}</p>
              </div>
              <button type="button" onClick={() => setMinimumPlan(false)}>
                إلغاء
              </button>
            </div>
          )}
        </>
      )}
      <section className="moment-grid">
        <article className="next-prayer">
          <span className="mini-icon">◐</span>
          <div>
            <p className="eyebrow">{t("moment.next")}</p>
            {upcoming ? (
              <>
                <h3>
                  {prayerName(lang, upcoming.id)} <b>{upcoming.at}</b>
                </h3>
                <p>{arDuration(upcoming.inMs)}</p>
                <PrayerArc times={prayerTimes} now={nowDate} />
              </>
            ) : (
              <>
                <h3>{t("moment.setTimes")}</h3>
                <p>{t("moment.setTimesSub")}</p>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => setRemindPrayer((v) => !v)}
            aria-pressed={remindPrayer}
          >
            {remindPrayer ? t("moment.remindOn") : t("moment.remind")}
          </button>
          <button
            type="button"
            onClick={() => setMosque((v) => !v)}
            aria-pressed={mosque}
            className={mosque ? "counter on" : "counter"}
            title={t("moment.mosqueTitle")}
          >
            🕌
          </button>
        </article>
        <article className="intention">
          <span>♡</span>
          <div>
            <p className="eyebrow">{t("moment.niyyah")}</p>
            <h3>{INTENT_KEYS.includes(intention) ? t(`intent.${intention}`) : intention}</h3>
          </div>
          <button type="button" aria-label={t("intent.edit")} onClick={editIntention}>
            ✎
          </button>
        </article>
        <article className="tasbeeh">
          <div>
            <p className="eyebrow">{t("tasbeeh.title")}</p>
            <h3>
              سبحان الله <b>{tasbeeh} / ٣٣</b>
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setTasbeeh((c) => (c >= 33 ? 0 : c + 1))}
            aria-pressed={tasbeeh >= 33}
            className={tasbeeh >= 33 ? "counter on" : "counter"}
          >
            {tasbeeh >= 33 ? t("tasbeeh.done") : "+ ١"}
          </button>
        </article>
      </section>
      <div className="section-heading">
        <div>
          <p className="eyebrow">{t("sec.dailyEyebrow")}</p>
          <h2>{t("sec.daily")}</h2>
        </div>
        <button type="button" className="filter" onClick={cycleFilter}>
          {t(`filter.${filter}`)}
        </button>
      </div>
      <div className="cards">
        {orderedSections.map((section) => (
          <article key={section.id} className={`card ${section.accent}`} data-tilt>
            <div className="card-top">
              <div className="prayer-icon">{section.icon}</div>
              <div>
                <h3>{section.title}</h3>
                <p>{section.time}</p>
              </div>
              <span className="card-count">
                {section.habits.filter((h) => done.includes(h.id)).length}/{section.habits.length}
              </span>
            </div>
            <div className="habit-list">
              {section.habits
                .filter((h) => passFilter(h.id))
                .map((habit) => (
                  <button
                    type="button"
                    className={done.includes(habit.id) ? "habit completed" : "habit"}
                    onClick={() => toggle(habit.id)}
                    aria-pressed={done.includes(habit.id)}
                    key={habit.id}
                  >
                    <span className="check">{done.includes(habit.id) ? "✓" : ""}</span>
                    <span className="habit-text">
                      <b>{habit.title}</b>
                      {habit.detail && <small>{habit.detail}</small>}
                    </span>
                    <span className="points">+{habit.points}</span>
                    {habit.optional && <em>؟</em>}
                  </button>
                ))}
            </div>
          </article>
        ))}
      </div>
      <section className="extras">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t("sec.extrasEyebrow")}</p>
            <h2>{t("sec.extras")}</h2>
          </div>
          <span className="spark">✦</span>
        </div>
        <div className="extra-grid">
          {[...extras, ...customs]
            .filter((h) => passFilter(h.id))
            .map((habit) => (
              <button
                type="button"
                onClick={() => toggle(habit.id)}
                aria-pressed={done.includes(habit.id)}
                className={done.includes(habit.id) ? "extra done" : "extra"}
                key={habit.id}
                data-tilt
              >
                <span className="extra-check">{done.includes(habit.id) ? "✓" : "+"}</span>
                <div>
                  <b>{habit.title}</b>
                  <small>{habit.detail || t("sec.moreDetail")}</small>
                </div>
                <span>+{habit.points}</span>
                {habit.id.startsWith("custom-") &&
                  editBtn({ kind: "custom", id: habit.id, title: habit.title })}
              </button>
            ))}
        </div>
      </section>
      <section className="quran-callout">
        <div className="quran-art">۝</div>
        <div className="quran-copy">
          <p className="eyebrow">{t("quran.eyebrow")}</p>
          <h2>
            {quranPages} من {QURAN_GOAL_PAGES} صفحة
          </h2>
          <p>
            {quranPages >= QURAN_GOAL_PAGES
              ? t("quran.full")
              : t("quran.next", { n: Math.min(2, QURAN_GOAL_PAGES - quranPages) })}
          </p>
          <div className="quran-progress">
            <span style={{ width: `${quranPct}%` }} />
          </div>
        </div>
        <div className="quran-actions">
          <button type="button" onClick={() => setQuranPages((p) => p + 1)}>
            أضف صفحة +
          </button>
          <button type="button" className="soft-button" onClick={scrollToQuran}>
            عرض خطتي
          </button>
        </div>
      </section>
      <section className="adhkar">
        <div>
          <span className="adhkar-icon">☷</span>
          <div>
            <p className="eyebrow">{t("adhkar.eyebrow")}</p>
            <h2>{t("adhkar.title")}</h2>
            <p>{t("adhkar.sub")}</p>
          </div>
        </div>
        <div className="tags">
          {adhkar.map((item) => (
            <button
              type="button"
              onClick={() => toggle(`adhkar-${item}`)}
              aria-pressed={done.includes(`adhkar-${item}`)}
              className={done.includes(`adhkar-${item}`) ? "tag tagged" : "tag"}
              key={item}
            >
              {done.includes(`adhkar-${item}`) && "✓ "}
              {item}
            </button>
          ))}
        </div>
      </section>
      <section className="companion-grid">
        <article className="dua-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t("dua.eyebrow")}</p>
              <h2>{t("dua.title")}</h2>
            </div>
            <span>☾</span>
          </div>
          <p className="dua-feature">{t("du.feat")}</p>
          <div className="dua-tags">
            {duas.map((dua, i) => (
              <button
                type="button"
                key={dua}
                onClick={() => toggle(`dua-${i}`)}
                aria-pressed={done.includes(`dua-${i}`)}
                className={done.includes(`dua-${i}`) ? "tag tagged" : "tag"}
              >
                {done.includes(`dua-${i}`) ? "✓ " : ""}
                {dua}
              </button>
            ))}
            {customDuas.map((dua, i) => (
              <button
                type="button"
                key={`custom-dua-${i}`}
                onClick={() => toggle(`dua-custom-${i}`)}
                aria-pressed={done.includes(`dua-custom-${i}`)}
                className={done.includes(`dua-custom-${i}`) ? "tag tagged" : "tag"}
              >
                {done.includes(`dua-custom-${i}`) ? "✓ " : ""}
                {dua}
                {editBtn({ kind: "dua", index: i, text: dua })}
              </button>
            ))}
          </div>
          <button type="button" className="add-dua" onClick={addDua}>
            + أضف دعاءً من قلبك
          </button>
        </article>
        <article className="gentle-card">
          <span className="gentle-star">✦</span>
          <p className="eyebrow">{t("gentle.eyebrow")}</p>
          <h2>{t("gentle.title")}</h2>
          <p>{t("gentle.sub")}</p>
          <div className="weekly">
            <span>{t("gentle.week")}</span>
            <b>{t("gentle.witr")}</b>
            <div>
              <i />
              <i />
              <i />
              <i />
              <i className="empty" />
              <i className="empty" />
              <i className="empty" />
            </div>
          </div>
        </article>
      </section>
      <section className="goals-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t("goals.eyebrow")}</p>
            <h2>{t("goals.title")}</h2>
          </div>
          <button type="button" className="filter" onClick={addGoal}>
            + أضف هدفًا
          </button>
        </div>
        <div className="goal-grid">
          <article data-tilt>
            <span className="goal-icon">☾</span>
            <div>
              <b>{t("goals.witr")}</b>
              <small>{t("goals.witrSub")}</small>
              <div className="tiny-progress">
                <i style={{ width: "57%" }} />
              </div>
            </div>
            <strong>٤ / ٧</strong>
          </article>
          <article data-tilt>
            <span className="goal-icon quran-goal">۝</span>
            <div>
              <b>{t("goals.quran")}</b>
              <small>{t("goals.quranSub")}</small>
              <div className="tiny-progress gold">
                <i style={{ width: "40%" }} />
              </div>
            </div>
            <strong>٤٠٪</strong>
          </article>
          <article data-tilt>
            <span className="goal-icon heart-goal">♡</span>
            <div>
              <b>{t("goals.kin")}</b>
              <small>{t("goals.kinSub")}</small>
              <div className="tiny-progress coral">
                <i style={{ width: "50%" }} />
              </div>
            </div>
            <strong>١ / ٢</strong>
          </article>
          {customGoals.map((g, gi) => (
            <article key={g.title} data-tilt className={g.done ? "goal-done" : ""}>
              <span className="goal-icon">✦</span>
              <div>
                <b>{g.title}</b>
                <small>{g.detail}</small>
                <div className="tiny-progress">
                  <i style={{ width: g.done ? "100%" : "5%" }} />
                </div>
              </div>
              <strong>{g.done ? t("goals.done") : t("goals.new")}</strong>
              <div className="chl-actions">
                <button
                  type="button"
                  className="mini-check"
                  onClick={() => toggleGoalDone(gi)}
                  aria-pressed={!!g.done}
                  aria-label={t("goals.checkAria")}
                >
                  {g.done ? "✓" : "+"}
                </button>
                {editBtn({ kind: "goal", index: gi, title: g.title, detail: g.detail })}
              </div>
            </article>
          ))}
          {challenges.map((c) => {
            const pct = Math.min(100, Math.round((c.checks.length / c.target) * 100));
            const todayDone = c.checks.includes(dayId());
            return (
              <article key={c.id} data-tilt>
                <span className="goal-icon">🏆</span>
                <div>
                  <b>{c.title}</b>
                  <small>
                    {c.checks.length} / {c.target} {t("ch.days")}
                  </small>
                  <div className="tiny-progress">
                    <i style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="chl-actions">
                  <button
                    type="button"
                    className="mini-check"
                    onClick={() => toggleChallengeDay(c.id)}
                    aria-pressed={todayDone}
                    aria-label={t("ch.checkAria")}
                  >
                    {todayDone ? "✓" : "+"}
                  </button>
                  {editBtn({ kind: "challenge", id: c.id, title: c.title })}
                  <button
                    type="button"
                    className="linklike"
                    onClick={() => removeChallenge(c.id)}
                    aria-label={t("ch.delAria")}
                  >
                    ✕
                  </button>
                </div>
              </article>
            );
          })}
          <button type="button" className="goal-add" onClick={addChallenge}>
            + تحدٍ جديد
          </button>
          {pledges.map((p) => {
            const pdone = p.checks.includes(dayId());
            return (
              <article key={p.id} data-tilt>
                <span className="goal-icon heart-goal">🤝</span>
                <div>
                  <b>{p.text}</b>
                  <small>
                    {p.stake ? `${t("pg.stake")}: ${p.stake} · ` : ""}
                    {p.checks.length} {t("pg.days")}
                  </small>
                  <div className="tiny-progress">
                    <i style={{ width: pdone ? "100%" : "5%" }} />
                  </div>
                </div>
                <div className="chl-actions">
                  <button
                    type="button"
                    className="mini-check"
                    onClick={() => togglePledge(p.id)}
                    aria-pressed={pdone}
                    aria-label={t("pg.checkAria")}
                  >
                    {pdone ? "✓" : "+"}
                  </button>
                  {editBtn({ kind: "pledge", id: p.id, text: p.text, stake: p.stake })}
                  <button
                    type="button"
                    className="linklike"
                    onClick={() => removePledge(p.id)}
                    aria-label={t("pg.delAria")}
                  >
                    ✕
                  </button>
                </div>
              </article>
            );
          })}
          <button type="button" className="goal-add" onClick={addPledge}>
            + عهد جديد
          </button>
        </div>
      </section>
      <section className="night-section">
        <div className="night-copy">
          <span>☾</span>
          <p className="eyebrow">{t("night.eyebrow")}</p>
          <h2>{t("night.title")}</h2>
          <p>{t("night.sub")}</p>
          <button type="button" onClick={() => setFocusMode(true)}>
            ابدأ روتين الليل ←
          </button>
        </div>
        <div className="reflection">
          <p className="eyebrow">{t("night.journalEyebrow")}</p>
          <h3>{t("night.journalQ")}</h3>
          {vaultState === "locked" ? (
            <VaultUnlock />
          ) : (
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder={t("night.journalPh")}
              aria-label={t("night.journalQ")}
            />
          )}
          <span>{t("night.journalNote")}</span>
        </div>
      </section>
      {editing?.kind === "custom" && (
        <EditModal
          title={t("modal.customT")}
          fields={[{ key: "title", label: t("modal.customL"), value: editing.title }]}
          onSave={saveEdit}
          onClose={() => setEditing(null)}
          onDelete={deleteEditing}
        />
      )}
      {editing?.kind === "dua" && (
        <EditModal
          title={t("modal.duaT")}
          fields={[{ key: "text", label: t("dua.title"), value: editing.text }]}
          onSave={saveEdit}
          onClose={() => setEditing(null)}
          onDelete={deleteEditing}
        />
      )}
      {editing?.kind === "goal" && (
        <EditModal
          title={t("modal.goalT")}
          fields={[
            { key: "title", label: t("modal.customL"), value: editing.title },
            { key: "detail", label: t("modal.goalD"), value: editing.detail },
          ]}
          onSave={saveEdit}
          onClose={() => setEditing(null)}
          onDelete={deleteEditing}
        />
      )}
      {editing?.kind === "challenge" && (
        <EditModal
          title={t("modal.chT")}
          fields={[{ key: "title", label: t("modal.customL"), value: editing.title }]}
          onSave={saveEdit}
          onClose={() => setEditing(null)}
          onDelete={deleteEditing}
        />
      )}
      {editing?.kind === "pledge" && (
        <EditModal
          title={t("modal.plgT")}
          fields={[
            { key: "text", label: t("modal.customL"), value: editing.text },
            { key: "stake", label: t("modal.plgS"), value: editing.stake },
          ]}
          onSave={saveEdit}
          onClose={() => setEditing(null)}
          onDelete={deleteEditing}
        />
      )}
      {editing?.kind === "kid" && (
        <EditModal
          title={t("modal.kidT")}
          fields={[{ key: "name", label: t("modal.customL"), value: editing.name }]}
          onSave={saveEdit}
          onClose={() => setEditing(null)}
          onDelete={deleteEditing}
        />
      )}
      <section className="seo-faq" aria-labelledby="seo-faq-title">
        <h2 id="seo-faq-title">{t("seo.faq.title")}</h2>
        {(
          [
            ["q1", "a1"],
            ["q2", "a2"],
            ["q3", "a3"],
            ["q4", "a4"],
            ["q5", "a5"],
          ] as Array<[string, string]>
        ).map(([q, a]) => (
          <details key={q}>
            <summary>{t(`seo.faq.${q}`)}</summary>
            <p>{t(`seo.faq.${a}`)}</p>
          </details>
        ))}
        <nav className="seo-links" aria-label={t("seo.links.title")}>
          <h3>{t("seo.links.title")}</h3>
          <ul>
            <li>
              <Link href="/library">{t("nav.library")}</Link>
            </li>
            <li>
              <Link href="/deen">{t("nav.deen")}</Link>
            </li>
            <li>
              <Link href="/calendar">{t("nav.calendar")}</Link>
            </li>
            <li>
              <Link href="/insights">{t("nav.insights")}</Link>
            </li>
          </ul>
        </nav>
        <script
          type="application/ld+json"
          // FAQPage mirrors the visible block above (same strings), so the
          // markup never disagrees with what the page actually says.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              inLanguage: lang === "en" ? "en" : "ar",
              mainEntity: (
                [
                  ["q1", "a1"],
                  ["q2", "a2"],
                  ["q3", "a3"],
                  ["q4", "a4"],
                  ["q5", "a5"],
                ] as Array<[string, string]>
              ).map(([q, a]) => ({
                "@type": "Question",
                name: t(`seo.faq.${q}`),
                acceptedAnswer: { "@type": "Answer", text: t(`seo.faq.${a}`) },
              })),
            }).replace(/</g, "\\u003c"),
          }}
        />
      </section>
      <footer>{t("footer.verse")}</footer>
    </>
  );
}
