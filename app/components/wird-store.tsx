"use client";

import {
  useEffect,
  useMemo,
  useState,
  createContext,
  useContext,
  type SetStateAction,
  type Dispatch,
  type ReactNode,
} from "react";
import {
  dayId,
  DEFAULT_DONE,
  DEFAULT_INTENTION,
  diffDays,
  extras,
  isRamadanDay,
  loadDailyList,
  loadDailyNumber,
  loadDailyText,
  loadFromStorage,
  QURAN_GOAL_PAGES,
  saveToStorage,
  sections,
  type Breaker,
  type Challenge,
  type QadaItem,
  type Habit,
} from "../lib/wird";
import { emptyDay, recordDay, type DayRecord, type History } from "../lib/history";
import { normalizeDayMode } from "../lib/daymode";
import type { PrayerTimes } from "../lib/prayer";

export type WirdStore = {
  done: string[];
  toggle: (id: string) => void;
  dayMode: string;
  setDayMode: Dispatch<SetStateAction<string>>;
  focusMode: boolean;
  setFocusMode: Dispatch<SetStateAction<boolean>>;
  showNow: boolean;
  setShowNow: Dispatch<SetStateAction<boolean>>;
  minimumPlan: boolean;
  setMinimumPlan: Dispatch<SetStateAction<boolean>>;
  quranSeconds: number;
  setQuranSeconds: Dispatch<SetStateAction<number>>;
  selectedMinutes: number;
  setSelectedMinutes: Dispatch<SetStateAction<number>>;
  quranStarted: boolean;
  setQuranStarted: Dispatch<SetStateAction<boolean>>;
  quranPages: number;
  setQuranPages: Dispatch<SetStateAction<number>>;
  showZikr: boolean;
  setShowZikr: Dispatch<SetStateAction<boolean>>;
  zikrCount: number;
  setZikrCount: Dispatch<SetStateAction<number>>;
  zikrName: string;
  setZikrName: Dispatch<SetStateAction<string>>;
  tasbeeh: number;
  setTasbeeh: Dispatch<SetStateAction<number>>;
  customs: Habit[];
  customDuas: string[];
  customGoals: { title: string; detail: string }[];
  intention: string;
  setIntention: Dispatch<SetStateAction<string>>;
  remindPrayer: boolean;
  setRemindPrayer: Dispatch<SetStateAction<boolean>>;
  forgetDone: string[];
  setForgetDone: Dispatch<SetStateAction<string[]>>;
  reflection: string;
  setReflection: Dispatch<SetStateAction<string>>;
  partial: string[];
  snoozed: string[];
  togglePartial: (id: string) => void;
  toggleSnooze: (id: string) => void;
  rampReduced: boolean;
  setRampReduced: Dispatch<SetStateAction<boolean>>;
  fridayAdded: boolean;
  setFridayAdded: Dispatch<SetStateAction<boolean>>;
  theme: Theme;
  setTheme: Dispatch<SetStateAction<Theme>>;
  lang: Lang;
  setLang: Dispatch<SetStateAction<Lang>>;
  prayerTimes: PrayerTimes;
  setPrayerTimes: Dispatch<SetStateAction<PrayerTimes>>;
  mosque: boolean;
  setMosque: Dispatch<SetStateAction<boolean>>;
  qada: QadaItem[];
  setQada: Dispatch<SetStateAction<QadaItem[]>>;
  addQada: (label: string) => void;
  clearQada: (id: string) => void;
  removeQada: (id: string) => void;
  qadaOpen: number;
  fastType: string | null;
  setFastType: Dispatch<SetStateAction<string | null>>;
  breaker: Breaker | null;
  setBreaker: Dispatch<SetStateAction<Breaker | null>>;
  startBreaker: () => void;
  logSlip: () => void;
  breakerCleanDays: number;
  challenges: Challenge[];
  addChallenge: () => void;
  toggleChallengeDay: (id: string) => void;
  removeChallenge: (id: string) => void;
  ramadan: boolean;
  completed: number;
  total: number;
  completedPoints: number;
  totalPoints: number;
  quranPct: number;
  ringDeg: string;
  hijriLabel: string;
  gregLabel: string;
  isFriday: boolean;
  allHabits: Habit[];
  addCustom: () => void;
  addDua: () => void;
  addGoal: () => void;
  editIntention: () => void;
  cycleFilter: () => void;
  passFilter: (id: string) => boolean;
  filter: "all" | "done" | "todo";
  scrollToQuran: () => void;
  resetDay: () => void;
  history: History;
  saveReview: (rec: DayRecord) => void;
};

export type Theme = "light" | "dark" | "oled";
export type Lang = "ar" | "en";

const WirdContext = createContext<WirdStore | null>(null);

export function useWird(): WirdStore {
  const store = useContext(WirdContext);
  if (!store) throw new Error("useWird must be used within WirdProvider");
  return store;
}

export function WirdProvider({ children }: { children: ReactNode }) {
  // NOTE: state initializes with static fallbacks so the first client render
  // matches SSR. Stored values load in the mount effect below (no hydration mismatch).
  const [mounted, setMounted] = useState(false);
  const [history, setHistory] = useState<History>({});
  const [done, setDone] = useState<string[]>(DEFAULT_DONE);
  const [dayMode, setDayMode] = useState("عادي");
  const [focusMode, setFocusMode] = useState(false);
  const [showNow, setShowNow] = useState(false);
  const [minimumPlan, setMinimumPlan] = useState(false);
  const [quranSeconds, setQuranSeconds] = useState(0);
  const [selectedMinutes, setSelectedMinutes] = useState(10);
  const [quranStarted, setQuranStarted] = useState(false);
  const [quranPages, setQuranPages] = useState(0);
  const [showZikr, setShowZikr] = useState(false);
  const [zikrCount, setZikrCount] = useState(0);
  const [zikrName, setZikrName] = useState("سبحان الله");
  const [tasbeeh, setTasbeeh] = useState(0);
  const [customs, setCustoms] = useState<Habit[]>([]);
  const [customDuas, setCustomDuas] = useState<string[]>([]);
  const [customGoals, setCustomGoals] = useState<{ title: string; detail: string }[]>([]);
  const [intention, setIntention] = useState(DEFAULT_INTENTION);
  const [remindPrayer, setRemindPrayer] = useState(false);
  const [filter, setFilter] = useState<"all" | "done" | "todo">("all");
  const [forgetDone, setForgetDone] = useState<string[]>([]);
  const [reflection, setReflection] = useState("");
  const [partial, setPartial] = useState<string[]>([]);
  const [snoozed, setSnoozed] = useState<string[]>([]);
  const [rampReduced, setRampReduced] = useState(false);
  const [fridayAdded, setFridayAdded] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");
  const [lang, setLang] = useState<Lang>("ar");
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes>({});
  const [mosque, setMosque] = useState(false);
  const [qada, setQada] = useState<QadaItem[]>([]);
  const [fastType, setFastType] = useState<string | null>(null);
  const [breaker, setBreaker] = useState<Breaker | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => {
    // Mount-once hydration: stored values are client-only, so they load here
    // (after mount) to keep the first client render identical to SSR HTML.
    const t = dayId();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDone(loadDailyList("wird-done-v2", DEFAULT_DONE, t));
    setDayMode(normalizeDayMode(loadFromStorage("wird-daymode-v1", "عادي")));
    setQuranPages(loadDailyNumber("wird-quran-pages-v2", 0, t));
    setTasbeeh(loadDailyNumber("wird-tasbeeh-v2", 0, t));
    setCustoms(loadFromStorage("wird-customs-v1", []));
    setCustomDuas(loadFromStorage("wird-duas-v1", []));
    setCustomGoals(loadFromStorage("wird-goals-v1", []));
    setIntention(loadFromStorage("wird-intention-v1", DEFAULT_INTENTION));
    setRemindPrayer(loadFromStorage("wird-remind-v1", false));
    setForgetDone(loadDailyList("wird-forget-v2", [], t));
    setReflection(loadDailyText("wird-reflection-v2", "", t));
    setPartial(loadDailyList("wird-partial-v2", [], t));
    setSnoozed(loadDailyList("wird-snoozed-v2", [], t));
    setRampReduced(loadFromStorage("wird-ramp-v1", false));
    setFridayAdded(loadFromStorage("wird-friday-plan-v1", false));
    const storedTheme = loadFromStorage<Theme | null>("wird-theme-v1", null);
    if (storedTheme) {
      setTheme(storedTheme);
      setLang(loadFromStorage<Lang>("wird-lang-v1", "ar"));
    } else {
      try {
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) setTheme("dark");
      } catch {}
    }
    setPrayerTimes(loadFromStorage("wird-prayer-times-v1", {}));
    setMosque(loadFromStorage("wird-mosque-v1", false));
    setQada(loadFromStorage("wird-qada-v1", []));
    setFastType(loadDailyText("wird-fast-v2", "", t) || null);
    setBreaker(loadFromStorage("wird-breaker-v1", null));
    setChallenges(loadFromStorage("wird-challenges-v1", []));
    setHistory(loadFromStorage("wird-history-v1", {}));
    setToday(new Date());
    setMounted(true);
  }, []);
  const quranRunning = quranSeconds > 0;
  useEffect(() => {
    if (!quranRunning) return;
    const id = window.setInterval(
      () => setQuranSeconds((current) => Math.max(0, current - 1)),
      1000,
    );
    return () => window.clearInterval(id);
  }, [quranRunning]);
  useEffect(() => {
    if (!mounted) return;
    saveToStorage("wird-done-v2", { day: dayId(), ids: done });
  }, [mounted, done]);
  useEffect(() => {
    if (!mounted) return;
    saveToStorage("wird-daymode-v1", dayMode);
  }, [mounted, dayMode]);
  useEffect(() => {
    if (!mounted) return;
    saveToStorage("wird-quran-pages-v2", { day: dayId(), value: quranPages });
  }, [mounted, quranPages]);
  useEffect(() => {
    if (!mounted) return;
    saveToStorage("wird-tasbeeh-v2", { day: dayId(), value: tasbeeh });
  }, [mounted, tasbeeh]);
  useEffect(() => {
    if (!mounted) return;
    saveToStorage("wird-customs-v1", customs);
  }, [mounted, customs]);
  useEffect(() => {
    if (!mounted) return;
    saveToStorage("wird-duas-v1", customDuas);
  }, [mounted, customDuas]);
  useEffect(() => {
    if (!mounted) return;
    saveToStorage("wird-goals-v1", customGoals);
  }, [mounted, customGoals]);
  useEffect(() => {
    if (!mounted) return;
    saveToStorage("wird-intention-v1", intention);
  }, [mounted, intention]);
  useEffect(() => {
    if (!mounted) return;
    saveToStorage("wird-remind-v1", remindPrayer);
  }, [mounted, remindPrayer]);
  useEffect(() => {
    if (!mounted) return;
    saveToStorage("wird-forget-v2", { day: dayId(), ids: forgetDone });
  }, [mounted, forgetDone]);
  useEffect(() => {
    if (!mounted) return;
    saveToStorage("wird-reflection-v2", { day: dayId(), text: reflection });
  }, [mounted, reflection]);
  useEffect(() => {
    if (!mounted) return;
    saveToStorage("wird-partial-v2", { day: dayId(), ids: partial });
  }, [mounted, partial]);
  useEffect(() => {
    if (!mounted) return;
    saveToStorage("wird-snoozed-v2", { day: dayId(), ids: snoozed });
  }, [mounted, snoozed]);
  useEffect(() => {
    if (!mounted) return;
    saveToStorage("wird-ramp-v1", rampReduced);
  }, [mounted, rampReduced]);
  useEffect(() => {
    if (!mounted) return;
    saveToStorage("wird-friday-plan-v1", fridayAdded);
  }, [mounted, fridayAdded]);
  useEffect(() => {
    if (!mounted) return;
    saveToStorage("wird-theme-v1", theme);
    try {
      document.documentElement.dataset.theme = theme === "light" ? "" : theme;
    } catch {}
  }, [mounted, theme]);
  useEffect(() => {
    if (!mounted) return;
    saveToStorage("wird-lang-v1", lang);
    try {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    } catch {}
  }, [mounted, lang]);
  useEffect(() => {
    if (!mounted) return;
    saveToStorage("wird-prayer-times-v1", prayerTimes);
  }, [mounted, prayerTimes]);
  useEffect(() => {
    if (!mounted) return;
    saveToStorage("wird-mosque-v1", mosque);
  }, [mounted, mosque]);
  useEffect(() => {
    if (!mounted) return;
    saveToStorage("wird-qada-v1", qada);
  }, [mounted, qada]);
  useEffect(() => {
    if (!mounted) return;
    saveToStorage("wird-fast-v2", { day: dayId(), text: fastType ?? "" });
  }, [mounted, fastType]);
  useEffect(() => {
    if (!mounted) return;
    saveToStorage("wird-breaker-v1", breaker);
  }, [mounted, breaker]);
  useEffect(() => {
    if (!mounted) return;
    saveToStorage("wird-challenges-v1", challenges);
  }, [mounted, challenges]);
  const allHabits = useMemo(
    () => [...sections.flatMap((s) => s.habits), ...extras, ...customs],
    [customs],
  );
  const isFriday = today != null && today.getDay() === 5;
  const hijriLabel = useMemo(() => {
    if (!today) return "";
    try {
      return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA-u-ca-islamic" : "en-u-ca-islamic", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(today);
    } catch {
      return "";
    }
  }, [today, lang]);
  const gregLabel = useMemo(() => {
    if (!today) return "";
    try {
      return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en", {
        day: "numeric",
        month: "long",
      }).format(today);
    } catch {
      return "";
    }
  }, [today, lang]);
  const completedPoints = allHabits
    .filter((h) => done.includes(h.id))
    .reduce((sum, h) => sum + h.points, 0);
  const totalPoints = allHabits.reduce((sum, h) => sum + h.points, 0);
  const toggle = (id: string) =>
    setDone((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  const togglePartial = (id: string) => {
    setPartial((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
    setDone((current) => current.filter((item) => item !== id));
  };
  const toggleSnooze = (id: string) =>
    setSnoozed((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  const resetDay = () => {
    setDone([]);
    setQuranPages(0);
    setQuranStarted(false);
    setQuranSeconds(0);
    setTasbeeh(0);
    setForgetDone([]);
    setPartial([]);
    setSnoozed([]);
  };
  const askName = (message: string) => {
    try {
      const v = window.prompt(message)?.trim();
      return v ? v : null;
    } catch {
      return null;
    }
  };
  const addCustom = () => {
    const title = askName("اسم العبادة المخصصة:");
    if (title)
      setCustoms((current) => [...current, { id: `custom-${Date.now()}`, title, points: 2 }]);
  };
  const addDua = () => {
    const dua = askName("اكتب دعاءً من قلبك:");
    if (dua) setCustomDuas((current) => [...current, dua]);
  };
  const addGoal = () => {
    const title = askName("اسم الهدف الجديد:");
    if (title)
      setCustomGoals((current) => [...current, { title, detail: "هدف جديد · ابدأ بخطوة صغيرة" }]);
  };
  const editIntention = () => {
    const v = askName("ما نيتك اليوم؟");
    if (v) setIntention(v);
  };
  const addQada = (label: string) => {
    const t = dayId();
    setQada((current) => [...current, { id: `qada-${Date.now()}`, label, day: t, cleared: false }]);
  };
  const clearQada = (id: string) => {
    setQada((current) => current.map((q) => (q.id === id ? { ...q, cleared: !q.cleared } : q)));
  };
  const removeQada = (id: string) => {
    setQada((current) => current.filter((q) => q.id !== id));
  };
  const qadaOpen = qada.filter((q) => !q.cleared).length;
  const startBreaker = () => {
    const name = askName("ما العادة التي تريد كسرها؟");
    if (name) setBreaker({ name, created: dayId(), slips: [] });
  };
  const logSlip = () => {
    const t = dayId();
    setBreaker((b) => (b && !b.slips.includes(t) ? { ...b, slips: [...b.slips, t] } : b));
  };
  const breakerCleanDays = breaker
    ? diffDays(
        breaker.slips.length > 0
          ? (breaker.slips[breaker.slips.length - 1] ?? breaker.created)
          : breaker.created,
        dayId(),
      )
    : 0;
  const addChallenge = () => {
    const title = askName("اسم التحدي (مثال: الفجر ٣٠ يومًا):");
    if (!title) return;
    const daysRaw = askName("عدد الأيام (مثال: ٣٠):");
    const target = Math.min(
      365,
      Math.max(
        2,
        parseInt(
          (daysRaw ?? "").replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString()),
          10,
        ) || 30,
      ),
    );
    setChallenges((current) => [
      ...current,
      { id: `chl-${Date.now()}`, title, target, start: dayId(), checks: [] },
    ]);
  };
  const toggleChallengeDay = (id: string) => {
    const t = dayId();
    setChallenges((current) =>
      current.map((c) =>
        c.id === id
          ? {
              ...c,
              checks: c.checks.includes(t) ? c.checks.filter((d) => d !== t) : [...c.checks, t],
            }
          : c,
      ),
    );
  };
  const removeChallenge = (id: string) => {
    try {
      if (!window.confirm("حذف هذا التحدي؟")) return;
    } catch {}
    setChallenges((current) => current.filter((c) => c.id !== id));
  };
  const ramadan = today != null && isRamadanDay(today);
  const cycleFilter = () =>
    setFilter((f) => (f === "all" ? "done" : f === "done" ? "todo" : "all"));
  const passFilter = (id: string) =>
    filter === "all" ? true : filter === "done" ? done.includes(id) : !done.includes(id);
  const scrollToQuran = () => {
    try {
      document
        .getElementById("quran-session")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch {}
  };
  const completed = allHabits.filter((h) => done.includes(h.id)).length;
  const total = allHabits.length;
  const quranPct = Math.min(100, Math.round((quranPages / QURAN_GOAL_PAGES) * 100));
  const ringDeg = `${(total ? completed / total : 0) * 360}deg`;
  const saveReview = (rec: DayRecord) => {
    setHistory((prev) => {
      const base = prev[rec.day] ?? emptyDay(rec.day);
      return { ...prev, [rec.day]: { ...base, ...rec, day: rec.day } };
    });
  };

  useEffect(() => {
    if (!mounted) return;
    saveToStorage("wird-history-v1", history);
  }, [mounted, history]);
  useEffect(() => {
    if (!mounted) return;
    const t = dayId();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory((prev) => recordDay(prev, { day: t, ids: done, pages: quranPages }));
  }, [mounted, done, quranPages]);
  const value: WirdStore = {
    done,
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
    showZikr,
    setShowZikr,
    zikrCount,
    setZikrCount,
    zikrName,
    setZikrName,
    tasbeeh,
    setTasbeeh,
    customs,
    customDuas,
    customGoals,
    intention,
    setIntention,
    remindPrayer,
    setRemindPrayer,
    forgetDone,
    setForgetDone,
    reflection,
    setReflection,
    partial,
    snoozed,
    togglePartial,
    toggleSnooze,
    rampReduced,
    setRampReduced,
    fridayAdded,
    setFridayAdded,
    theme,
    setTheme,
    lang,
    setLang,
    prayerTimes,
    setPrayerTimes,
    mosque,
    setMosque,
    qada,
    setQada,
    addQada,
    clearQada,
    removeQada,
    qadaOpen,
    fastType,
    setFastType,
    breaker,
    setBreaker,
    startBreaker,
    logSlip,
    breakerCleanDays,
    challenges,
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
    hijriLabel,
    gregLabel,
    isFriday,
    allHabits,
    addCustom,
    addDua,
    addGoal,
    editIntention,
    cycleFilter,
    passFilter,
    filter,
    scrollToQuran,
    resetDay,
    history,
    saveReview,
  };
  return <WirdContext.Provider value={value}>{children}</WirdContext.Provider>;
}
