"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  adhkar,
  dayId,
  DEFAULT_DONE,
  DEFAULT_INTENTION,
  duas,
  extras,
  loadDailyList,
  loadDailyNumber,
  loadDailyText,
  loadFromStorage,
  NAV_ITEMS,
  QURAN_GOAL_PAGES,
  saveToStorage,
  sections,
  type Habit,
} from "./lib/wird";

function ProgressView() {
  const [period, setPeriod] = useState("آخر ٧ أيام");
  const days = ["س", "ح", "ن", "ث", "ر", "خ", "ج"];
  const heights = [54, 76, 43, 88, 67, 93, 72];
  return (
    <section className="destination-view">
      <div className="view-hero">
        <p className="eyebrow">تقدّمك شخصي وخاص</p>
        <h2>خطواتك الهادئة تصنع أثرًا</h2>
        <p>اختر الفترة التي تود أن تتأملها، بلا مقارنة ولا لوم.</p>
        <div className="periods">
          {[
            "اليوم",
            "آخر ٧ أيام",
            "أسبوعان",
            "الشهر الحالي",
            "٣ أشهر",
            "الموسم",
            "السنة",
          ].map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => setPeriod(item)}
              aria-pressed={period === item}
              className={period === item ? "selected" : ""}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="metric-row">
        <article>
          <span>٧٢٪</span>
          <p>متوسط إنجازك</p>
          <small>↑ ٨٪ عن الأسبوع السابق</small>
        </article>
        <article>
          <span>٥/٧</span>
          <p>أيام الوتر</p>
          <small>عادة ثابتة وجميلة</small>
        </article>
        <article>
          <span>٢٤</span>
          <p>صفحة قرآن</p>
          <small>باقي ٤ صفحات لهدفك</small>
        </article>
        <article>
          <span>🔥 ٣</span>
          <p>سلسلة الالتزام</p>
          <small>يومًا متتاليًا</small>
        </article>
      </div>
      <div className="insight-grid">
        <article className="weekly-chart">
          <div>
            <p className="eyebrow">آخر ٧ أيام</p>
            <h2>نظرة أسبوعية</h2>
          </div>
          <div className="chart">
            {days.map((day, i) => (
              <div key={day}>
                <i style={{ height: `${heights[i]}%` }} />
                <span>{day}</span>
              </div>
            ))}
          </div>
          <p className="chart-caption">
            أفضل وقت لك كان بعد الفجر — بداية موفقة ليومك.
          </p>
        </article>
        <article className="soft-insight">
          <span>✦</span>
          <p className="eyebrow">ملاحظة لطيفة</p>
          <h2>الفجر يتحسن بهدوء</h2>
          <p>التزامك بصلاة الفجر تحسّن ٢٥٪ مقارنة بالأسبوعين السابقين.</p>
          <button type="button">عرض التفاصيل</button>
        </article>
      </div>
      <div className="badge-row">
        <p>شاراتك اللطيفة</p>
        {["فجر ٧ أيام", "وتر ١٤ ليلة", "رفيق الجمعة", "ورد ٣٠ يومًا"].map(
          (item) => (
            <span key={item}>✦ {item}</span>
          ),
        )}
      </div>
    </section>
  );
}

function CalendarView({
  fridayAdded,
  onFridayAdd,
}: {
  fridayAdded: boolean;
  onFridayAdd: () => void;
}) {
  const [calDay, setCalDay] = useState<number | null>(null);
  const dates = Array.from({ length: 30 }, (_, i) => i + 1);
  return (
    <section className="destination-view">
      <div className="calendar-heading">
        <div>
          <p className="eyebrow">ربيع الأول ١٤٤٨ هـ</p>
          <h2>تقويم رحلتك الهادئة</h2>
          <p>اضغط على أي يوم لتتذكر ما أنجزته فيه.</p>
        </div>
        <button type="button">‹ سبتمبر ٢٠٢٦ ›</button>
      </div>
      <div className="calendar-legend">
        <span>
          <i className="excellent" /> إنجاز ممتاز
        </span>
        <span>
          <i className="good" /> إنجاز جيد
        </span>
        <span>
          <i className="partial" /> إنجاز جزئي
        </span>
        <span>
          <i className="season" /> مناسبة
        </span>
      </div>
      <div className="calendar">
        <b>س</b>
        <b>ح</b>
        <b>ن</b>
        <b>ث</b>
        <b>ر</b>
        <b>خ</b>
        <b>ج</b>
        {dates.map((day) => (
          <button
            type="button"
            key={day}
            onClick={() => setCalDay(day)}
            aria-pressed={calDay === day}
            className={[
              day === 15
                ? "season"
                : day % 7 === 0
                  ? "excellent"
                  : day % 5 === 0
                    ? "good"
                    : day % 4 === 0
                      ? "partial"
                      : "",
              calDay === day ? "selected" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <strong>{day}</strong>
            {day === 15 && <small>أيام بيض</small>}
            {day === 5 && <small>جمعة</small>}
          </button>
        ))}
      </div>
      {calDay != null && (
        <p className="chart-caption">
          يوم {calDay}: سجّل وردك من صفحة اليوم، وسيُحفظ تقدمك هنا.
        </p>
      )}
      <article className="calendar-note">
        <span>☾</span>
        <div>
          <b>الجمعة القادمة</b>
          <p>سورة الكهف • الصلاة على النبي ﷺ • التبكير للصلاة</p>
        </div>
        <button type="button" onClick={onFridayAdd} aria-pressed={fridayAdded}>
          {fridayAdded ? "✓ أُضيفت للخطة" : "أضف لخطة الجمعة"}
        </button>
      </article>
    </section>
  );
}

function AdhkarView() {
  const [salawat, setSalawat] = useState(() =>
    loadDailyNumber("wird-salawat-v2", 0, dayId()),
  );
  useEffect(() => {
    saveToStorage("wird-salawat-v2", { day: dayId(), value: salawat });
  }, [salawat]);
  return (
    <section className="destination-view adhkar-view">
      <div className="view-hero">
        <p className="eyebrow">أذكار في وقتها</p>
        <h2>اذكر الله في تفاصيل يومك</h2>
        <p>اختر ذكرًا يناسب لحظتك، واحفظ ما تحب العودة إليه.</p>
      </div>
      <div className="adhkar-groups">
        {[
          ["☀", "الصباح", "ابدأ يومك بسكينة"],
          ["◐", "بعد الصلاة", "أذكار قصيرة بعد كل فريضة"],
          ["☾", "المساء والنوم", "اختم يومك بالطمأنينة"],
          ["⌂", "المواقف اليومية", "سفر، طعام، مسجد، منزل"],
        ].map(([icon, title, description]) => (
          <button type="button" key={title}>
            <span>{icon}</span>
            <div>
              <b>{title}</b>
              <small>{description}</small>
            </div>
            <i>‹</i>
          </button>
        ))}
      </div>
      <article className="counter-feature">
        <div>
          <p className="eyebrow">ورد اليوم</p>
          <h2>الصلاة على النبي ﷺ</h2>
          <p>١٠٠ مرة • اجعلها رفيقة يومك</p>
        </div>
        <b>{salawat >= 100 ? "✓" : salawat}</b>
        <button
          type="button"
          onClick={() => setSalawat((c) => (c >= 100 ? 0 : c + 1))}
        >
          {salawat >= 100 ? "تم الورد · ابدأ من جديد" : "ابدأ العدّاد"}
        </button>
      </article>
    </section>
  );
}

function AccountView({ onReset }: { onReset: () => void }) {
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
    </section>
  );
}

function NowView({
  done,
  toggle,
  partial,
  snoozed,
  onPartial,
  onSnooze,
  onAdd,
}: {
  done: string[];
  toggle: (id: string) => void;
  partial: string[];
  snoozed: string[];
  onPartial: (id: string) => void;
  onSnooze: (id: string) => void;
  onAdd: () => void;
}) {
  const items = [
    { id: "fajr-jamaa", title: "صلاة الفجر", detail: "في وقتها · جماعة" },
    { id: "after-fajr", title: "أذكار بعد الصلاة", detail: "دقيقتان بهدوء" },
    { id: "morning", title: "أذكار الصباح", detail: "٦ من ١٠" },
    { id: "quran", title: "ورد القرآن", detail: "صفحتان من ٤" },
  ].filter((item) => !snoozed.includes(item.id));
  return (
    <section className="now-view">
      <div className="now-header">
        <div>
          <p className="eyebrow">ما يناسب وقتك الآن</p>
          <h2>بعد الفجر، بداية مباركة</h2>
          <p>أربع خطوات فقط. خذ منها ما تيسر لك.</p>
        </div>
        <span>☀</span>
      </div>
      <div className="now-list">
        {items.map((item) => (
          <article key={item.id}>
            <button
              type="button"
              onClick={() => toggle(item.id)}
              aria-pressed={done.includes(item.id)}
              className={
                done.includes(item.id)
                  ? "now-check ready"
                  : partial.includes(item.id)
                    ? "now-check partial"
                    : "now-check"
              }
            >
              {done.includes(item.id)
                ? "✓"
                : partial.includes(item.id)
                  ? "◐"
                  : ""}
            </button>
            <div>
              <b>{item.title}</b>
              <small>{item.detail}</small>
            </div>
            <div className="quick-status">
              <button type="button" onClick={() => toggle(item.id)}>
                ✅ تم
              </button>
              <button type="button" onClick={() => onPartial(item.id)}>
                ◐ جزئيًا
              </button>
              <button type="button" onClick={() => onSnooze(item.id)}>
                ↷ لاحقًا
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="now-footer">
        <span>ما زال في اليوم خير كثير.</span>
        <button type="button" onClick={onAdd}>
          + أضف عبادة
        </button>
      </div>
    </section>
  );
}

export default function Home() {
  // NOTE: state initializes with static fallbacks so the first client render
  // matches SSR. Stored values load in the mount effect below (no hydration mismatch).
  const [mounted, setMounted] = useState(false);
  const [done, setDone] = useState<string[]>(DEFAULT_DONE);
  const [active, setActive] = useState("today");
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
  const [customGoals, setCustomGoals] = useState<
    { title: string; detail: string }[]
  >([]);
  const [intention, setIntention] = useState(DEFAULT_INTENTION);
  const [remindPrayer, setRemindPrayer] = useState(false);
  const [filter, setFilter] = useState<"all" | "done" | "todo">("all");
  const [forgetDone, setForgetDone] = useState<string[]>([]);
  const [reflection, setReflection] = useState("");
  const [partial, setPartial] = useState<string[]>([]);
  const [snoozed, setSnoozed] = useState<string[]>([]);
  const [rampReduced, setRampReduced] = useState(false);
  const [fridayAdded, setFridayAdded] = useState(false);
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => {
    // Mount-once hydration: stored values are client-only, so they load here
    // (after mount) to keep the first client render identical to SSR HTML.
    const t = dayId();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDone(loadDailyList("wird-done-v2", DEFAULT_DONE, t));
    setDayMode(loadFromStorage("wird-daymode-v1", "عادي"));
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
  const allHabits = useMemo(
    () => [...sections.flatMap((s) => s.habits), ...extras, ...customs],
    [customs],
  );
  const isFriday = today != null && today.getDay() === 5;
  const hijriLabel = useMemo(() => {
    if (!today) return "";
    try {
      return new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(today);
    } catch {
      return "";
    }
  }, [today]);
  const gregLabel = useMemo(() => {
    if (!today) return "";
    try {
      return new Intl.DateTimeFormat("ar-EG", {
        day: "numeric",
        month: "long",
      }).format(today);
    } catch {
      return "";
    }
  }, [today]);
  const completedPoints = allHabits
    .filter((h) => done.includes(h.id))
    .reduce((sum, h) => sum + h.points, 0);
  const totalPoints = allHabits.reduce((sum, h) => sum + h.points, 0);
  const toggle = (id: string) =>
    setDone((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  const togglePartial = (id: string) => {
    setPartial((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
    setDone((current) => current.filter((item) => item !== id));
  };
  const toggleSnooze = (id: string) =>
    setSnoozed((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
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
      setCustoms((current) => [
        ...current,
        { id: `custom-${Date.now()}`, title, points: 2 },
      ]);
  };
  const addDua = () => {
    const dua = askName("اكتب دعاءً من قلبك:");
    if (dua) setCustomDuas((current) => [...current, dua]);
  };
  const addGoal = () => {
    const title = askName("اسم الهدف الجديد:");
    if (title)
      setCustomGoals((current) => [
        ...current,
        { title, detail: "هدف جديد · ابدأ بخطوة صغيرة" },
      ]);
  };
  const editIntention = () => {
    const v = askName("ما نيتك اليوم؟");
    if (v) setIntention(v);
  };
  const cycleFilter = () =>
    setFilter((f) => (f === "all" ? "done" : f === "done" ? "todo" : "all"));
  const filterLabel =
    filter === "all" ? "⌄ الكل" : filter === "done" ? "✓ المكتمل" : "○ المتبقي";
  const passFilter = (id: string) =>
    filter === "all"
      ? true
      : filter === "done"
        ? done.includes(id)
        : !done.includes(id);
  const scrollToQuran = () => {
    try {
      document
        .getElementById("quran-session")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch {}
  };
  const completed = allHabits.filter((h) => done.includes(h.id)).length;
  const total = allHabits.length;
  const quranPct = Math.min(
    100,
    Math.round((quranPages / QURAN_GOAL_PAGES) * 100),
  );
  const ringDeg = `${(total ? completed / total : 0) * 360}deg`;

  return (
    <main>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">و</span>
          <span>وِرد</span>
        </div>
        <nav>
          {NAV_ITEMS.map(([id, icon, label]) => (
            <button
              type="button"
              key={id}
              onClick={() => setActive(id)}
              className={active === id ? "nav-item active" : "nav-item"}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="streak-small">
            <span>🔥</span>
            <div>
              <b>٣ أيام متتالية</b>
              <small>واصل هذا النور</small>
            </div>
          </div>
          <button
            type="button"
            className="profile"
            onClick={() => setActive("account")}
          >
            <span>م</span>
            <div>
              محمد عبدالله<small>الحمدلله دائمًا</small>
            </div>
            <i>⌄</i>
          </button>
        </div>
      </aside>
      <section className="content">
        <header>
          <div>
            <p className="eyebrow">{hijriLabel || "يوم جديد"}</p>
            <h1>
              صباح النور، محمد <span>☀</span>
            </h1>
            <p className="subhead">
              كل خطوة صغيرة تقرّبك. جعل الله يومك عامرًا بذكره.
            </p>
          </div>
          <button
            type="button"
            className="date-button"
            onClick={() => setActive("calendar")}
          >
            ‹ <span>اليوم</span> {gregLabel} ›
          </button>
        </header>
        {active === "insights" ? (
          <ProgressView />
        ) : active === "calendar" ? (
          <CalendarView
            fridayAdded={fridayAdded}
            onFridayAdd={() => setFridayAdded((v) => !v)}
          />
        ) : active === "library" ? (
          <AdhkarView />
        ) : active === "account" ? (
          <AccountView onReset={resetDay} />
        ) : (
          <>
            {focusMode ? (
              <section className="focus-card">
                <button type="button" onClick={() => setFocusMode(false)}>
                  × إنهاء التركيز
                </button>
                <span>☾</span>
                <p className="eyebrow">لحظة واحدة تكفي</p>
                <h2>هل أوترت اليوم؟</h2>
                <p>ركعة واحدة قد تكون أجمل ختام ليومك.</p>
                <button
                  type="button"
                  className="focus-action"
                  onClick={() => toggle("witr")}
                  aria-pressed={done.includes("witr")}
                >
                  {done.includes("witr")
                    ? "✓ تم تسجيل الوتر"
                    : "سجّل الوتر الآن"}
                </button>
              </section>
            ) : (
              <>
                <section className="hero">
                  <div className="hero-copy">
                    <span className="pill">رحلتك اليوم · يوم {dayMode}</span>
                    <h2>أنت تصنع أثرًا جميلًا</h2>
                    <p>
                      أكملت <b>{completed}</b> من {total} وردًا اليوم. استمر،
                      فالقليل الدائم أحبّ إلى الله.
                    </p>
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
                        <small>إنجاز اليوم</small>
                      </b>
                      <b>
                        {completedPoints} / {totalPoints}{" "}
                        <small>نقطة بركة</small>
                      </b>
                    </div>
                  </div>
                  <div
                    className="hero-ring"
                    style={{ "--ring": ringDeg } as CSSProperties}
                  >
                    <div>
                      <b>{completed}</b>
                      <span>مكتمل</span>
                    </div>
                  </div>
                  <div className="hero-deco">✦</div>
                </section>
                <section className="mode-bar">
                  <div>
                    <b>كيف يبدو يومك؟</b>
                    <small>اختر ما يناسب قدرتك اليوم.</small>
                  </div>
                  <div>
                    {["كامل", "عادي", "مشغول", "سفر", "مرض"].map((mode) => (
                      <button
                        type="button"
                        onClick={() => {
                          setDayMode(mode);
                          setMinimumPlan(
                            mode === "مشغول" ||
                              mode === "سفر" ||
                              mode === "مرض",
                          );
                        }}
                        className={dayMode === mode ? "selected" : ""}
                        key={mode}
                      >
                        {mode}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="focus-trigger"
                      onClick={() => setFocusMode(true)}
                    >
                      ◉ تركيز
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
                    <b>الآن</b>
                    <small>ما يناسب وقتك</small>
                  </button>
                  <button
                    type="button"
                    className={minimumPlan ? "active minimum" : ""}
                    onClick={() => setMinimumPlan(!minimumPlan)}
                    aria-pressed={minimumPlan}
                  >
                    <span>✦</span>
                    <b>أقل ورد لليوم</b>
                    <small>أساسيات بلا ضغط</small>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMinimumPlan(true);
                      setShowNow(true);
                    }}
                  >
                    <span>↻</span>
                    <b>ابدأ من الآن</b>
                    <small>ما زال في اليوم خير</small>
                  </button>
                  <button type="button" onClick={addCustom}>
                    <span>＋</span>
                    <b>عبادة مخصصة</b>
                    <small>أضف ما يناسبك</small>
                  </button>
                </section>
                <section className="rescue-plan">
                  <div className="rescue-top">
                    <div>
                      <p className="eyebrow">خطة إنقاذ اليوم</p>
                      <h2>خطوة صغيرة، وأثرها كبير</h2>
                      <p>لا تحتاج أن تنجز كل شيء. اختر ما يناسبك الآن.</p>
                    </div>
                    <span>✦</span>
                  </div>
                  <div className="rescue-grid">
                    <article className="one-now">
                      <p className="eyebrow">عبادة واحدة الآن</p>
                      <h3>أذكار الصباح</h3>
                      <p>دقيقتان تضيئان بداية يومك.</p>
                      <button
                        type="button"
                        onClick={() => toggle("morning")}
                        aria-pressed={done.includes("morning")}
                      >
                        {done.includes("morning")
                          ? "✓ تم تسجيلها"
                          : "ابدأ الآن ←"}
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
                            ? "أحسنت، انتهت الجلسة"
                            : "ابدأ جلسة قرآن"}
                      </h3>
                      {quranStarted && !quranSeconds ? (
                        <div className="pages-ask">
                          <span>كم صفحة قرأت؟</span>
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
                                className={
                                  selectedMinutes === minute ? "selected" : ""
                                }
                                onClick={() => setSelectedMinutes(minute)}
                                key={minute}
                              >
                                {minute} د
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
                            {quranSeconds ? "الجلسة مستمرة" : "ابدأ الجلسة"}
                          </button>
                        </>
                      )}
                    </article>
                    <article className="daily-dua">
                      <p className="eyebrow">دعاؤك اليوم</p>
                      <h3>اللهم ارزق والديّ الصحة والعافية</h3>
                      <p>دعاء للوالدين</p>
                      <button
                        type="button"
                        onClick={() => toggle("daily-dua")}
                        aria-pressed={done.includes("daily-dua")}
                      >
                        {done.includes("daily-dua")
                          ? "✓ دعوت به اليوم"
                          : "دعوت به اليوم"}
                      </button>
                    </article>
                  </div>
                  <div className="rescue-bottom">
                    <div>
                      <span>◷</span>
                      <p>
                        <b>الاستعداد للصلاة</b>
                        <small>بقي ٢٠ دقيقة على العصر · هل تريد الوضوء؟</small>
                      </p>
                    </div>
                    <button type="button" onClick={() => setFocusMode(true)}>
                      وضع تركيز حتى الصلاة
                    </button>
                    <button
                      type="button"
                      className="record-prayer"
                      onClick={() => toggle("dhuhr-jamaa")}
                      aria-pressed={done.includes("dhuhr-jamaa")}
                    >
                      {done.includes("dhuhr-jamaa") ? "✓ سُجّلت" : "سجل الصلاة"}
                    </button>
                  </div>
                </section>
                <section className="steady-grid">
                  <article className="ramp-card">
                    <div>
                      <p className="eyebrow">ورد متدرج</p>
                      <h3>
                        {rampReduced
                          ? "الوضع المخفف · صفحة واحدة يوميًا"
                          : "الأسبوع الثاني · صفحتان يوميًا"}
                      </h3>
                      <p>
                        تقدّمك هادئ وثابت. يمكنك التوقف أو تقليل الهدف متى شئت.
                      </p>
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
                      {rampReduced ? "أعد الورد" : "خفّف الورد"}
                    </button>
                  </article>
                  <article className="intention-card">
                    <span>♡</span>
                    <div>
                      <p className="eyebrow">قبل العمل أو الدراسة</p>
                      <h3>ما نيتك الآن؟</h3>
                      <div>
                        {[
                          "طلب الرزق الحلال",
                          "إتقان العمل",
                          "نفع الناس",
                          "التعلم",
                          "إعانة الأسرة",
                        ].map((item) => (
                          <button
                            type="button"
                            key={item}
                            onClick={() => setIntention(item)}
                            aria-pressed={intention === item}
                            className={intention === item ? "selected" : ""}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </article>
                </section>
                <section className="friday-card">
                  <span>☾</span>
                  <div>
                    <p className="eyebrow">
                      رفيق الجمعة {isFriday ? "· اليوم" : "· خطتك القادمة"}
                    </p>
                    <h3>
                      {isFriday
                        ? "جمعة مباركة، وردك ينتظرك"
                        : "ورد الجمعة بانتظارك"}
                    </h3>
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
                          className={
                            done.includes(`friday-${item}`) ? "complete" : ""
                          }
                          key={item}
                        >
                          {done.includes(`friday-${item}`) ? "✓ " : ""}
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                  <b>
                    {done.filter((item) => item.startsWith("friday-")).length} /
                    ٦
                  </b>
                </section>
                <section className="utility-row">
                  <article>
                    <div>
                      <p className="eyebrow">مفضلة المستخدم</p>
                      <div className="favorite-tags">
                        {[
                          "الوتر",
                          "ورد القرآن",
                          "أذكار الصباح",
                          "صلة الوالدين",
                          "الاستغفار",
                        ].map((item) => (
                          <button
                            type="button"
                            onClick={() => toggle(`fav-${item}`)}
                            aria-pressed={done.includes(`fav-${item}`)}
                            className={
                              done.includes(`fav-${item}`) ? "fav on" : "fav"
                            }
                            key={item}
                          >
                            {done.includes(`fav-${item}`) ? "✓ " : ""}
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </article>
                  <article className="dont-forget">
                    <p className="eyebrow">لا تنسَ</p>
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
                    <p className="eyebrow">دفتر التوبة والاستغفار</p>
                    <b>أحتاج إلى استغفار اليوم</b>
                    <button
                      type="button"
                      onClick={() => toggle("tawbah")}
                      aria-pressed={done.includes("tawbah")}
                    >
                      {done.includes("tawbah") ? "✓ تم" : "سجّلها لنفسك"}
                    </button>
                  </article>
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
                      <b>خطة الحد الأدنى مفعّلة</b>
                      <p>
                        الصلوات، ذكر قصير، آية واحدة، استغفار ١٠ مرات، والوتر.
                        هذا يكفي لليوم.
                      </p>
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
                  <p className="eyebrow">الصلاة القادمة</p>
                  <h3>
                    الظهر <b>١٢:٠٨</b>
                  </h3>
                  <p>باقي ساعة و ٤٧ دقيقة</p>
                </div>
                <button
                  type="button"
                  onClick={() => setRemindPrayer((v) => !v)}
                  aria-pressed={remindPrayer}
                >
                  {remindPrayer ? "✓ سيتم تنبيهك" : "تنبيه قبل الأذان"}
                </button>
              </article>
              <article className="intention">
                <span>♡</span>
                <div>
                  <p className="eyebrow">نية اليوم</p>
                  <h3>{intention}</h3>
                </div>
                <button
                  type="button"
                  aria-label="تعديل النية"
                  onClick={editIntention}
                >
                  ✎
                </button>
              </article>
              <article className="tasbeeh">
                <div>
                  <p className="eyebrow">عداد الذكر السريع</p>
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
                  {tasbeeh >= 33 ? "✓ اكتمل" : "+ ١"}
                </button>
              </article>
            </section>
            <div className="section-heading">
              <div>
                <p className="eyebrow">وردك اليومي</p>
                <h2>الصلوات والأوراد</h2>
              </div>
              <button type="button" className="filter" onClick={cycleFilter}>
                {filterLabel}
              </button>
            </div>
            <div className="cards">
              {sections.map((section) => (
                <article key={section.id} className={`card ${section.accent}`}>
                  <div className="card-top">
                    <div className="prayer-icon">{section.icon}</div>
                    <div>
                      <h3>{section.title}</h3>
                      <p>{section.time}</p>
                    </div>
                    <span className="card-count">
                      {section.habits.filter((h) => done.includes(h.id)).length}
                      /{section.habits.length}
                    </span>
                  </div>
                  <div className="habit-list">
                    {section.habits
                      .filter((h) => passFilter(h.id))
                      .map((habit) => (
                        <button
                          type="button"
                          className={
                            done.includes(habit.id)
                              ? "habit completed"
                              : "habit"
                          }
                          onClick={() => toggle(habit.id)}
                          aria-pressed={done.includes(habit.id)}
                          key={habit.id}
                        >
                          <span className="check">
                            {done.includes(habit.id) ? "✓" : ""}
                          </span>
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
                  <p className="eyebrow">أكثر من الصلاة</p>
                  <h2>ورد القرآن والخير</h2>
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
                      className={
                        done.includes(habit.id) ? "extra done" : "extra"
                      }
                      key={habit.id}
                    >
                      <span className="extra-check">
                        {done.includes(habit.id) ? "✓" : "+"}
                      </span>
                      <div>
                        <b>{habit.title}</b>
                        <small>{habit.detail || "عمل يسير وأثر كبير"}</small>
                      </div>
                      <span>+{habit.points}</span>
                    </button>
                  ))}
              </div>
            </section>
            <section className="quran-callout">
              <div className="quran-art">۝</div>
              <div className="quran-copy">
                <p className="eyebrow">ورد القرآن اليومي</p>
                <h2>
                  {quranPages} من {QURAN_GOAL_PAGES} صفحة
                </h2>
                <p>
                  {quranPages >= QURAN_GOAL_PAGES
                    ? "ما شاء الله، أتممت وردك اليوم. زد ما شئت."
                    : `خطوتك القادمة: أكمل ${Math.min(2, QURAN_GOAL_PAGES - quranPages)} صفحات.`}
                </p>
                <div className="quran-progress">
                  <span style={{ width: `${quranPct}%` }} />
                </div>
              </div>
              <div className="quran-actions">
                <button
                  type="button"
                  onClick={() => setQuranPages((p) => p + 1)}
                >
                  أضف صفحة +
                </button>
                <button
                  type="button"
                  className="soft-button"
                  onClick={scrollToQuran}
                >
                  عرض خطتي
                </button>
              </div>
            </section>
            <section className="adhkar">
              <div>
                <span className="adhkar-icon">☷</span>
                <div>
                  <p className="eyebrow">أذكار متنوعة</p>
                  <h2>اذكر الله في تفاصيل يومك</h2>
                  <p>أدعية قصيرة تُعينك على حضور القلب في كل لحظة.</p>
                </div>
              </div>
              <div className="tags">
                {adhkar.map((item) => (
                  <button
                    type="button"
                    onClick={() => toggle(`adhkar-${item}`)}
                    aria-pressed={done.includes(`adhkar-${item}`)}
                    className={
                      done.includes(`adhkar-${item}`) ? "tag tagged" : "tag"
                    }
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
                    <p className="eyebrow">مساحتك الخاصة</p>
                    <h2>دعائي اليوم</h2>
                  </div>
                  <span>☾</span>
                </div>
                <p className="dua-feature">
                  “اللهم أعنّي على ذكرك وشكرك وحسن عبادتك.”
                </p>
                <div className="dua-tags">
                  {duas.map((dua, i) => (
                    <button
                      type="button"
                      key={dua}
                      onClick={() => toggle(`dua-${i}`)}
                      aria-pressed={done.includes(`dua-${i}`)}
                      className={
                        done.includes(`dua-${i}`) ? "tag tagged" : "tag"
                      }
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
                      className={
                        done.includes(`dua-custom-${i}`) ? "tag tagged" : "tag"
                      }
                    >
                      {done.includes(`dua-custom-${i}`) ? "✓ " : ""}
                      {dua}
                    </button>
                  ))}
                </div>
                <button type="button" className="add-dua" onClick={addDua}>
                  + أضف دعاءً من قلبك
                </button>
              </article>
              <article className="gentle-card">
                <span className="gentle-star">✦</span>
                <p className="eyebrow">تذكير لطيف</p>
                <h2>كل يوم بداية جديدة</h2>
                <p>
                  فاتك شيء؟ لا بأس. اختر عملًا صغيرًا الآن، والله يحب العمل
                  الدائم ولو كان قليلًا.
                </p>
                <div className="weekly">
                  <span>هذا الأسبوع</span>
                  <b>الوتر ٥ أيام</b>
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
                  <p className="eyebrow">أهدافك على مهل</p>
                  <h2>رحلتك الروحية</h2>
                </div>
                <button type="button" className="filter" onClick={addGoal}>
                  + أضف هدفًا
                </button>
              </div>
              <div className="goal-grid">
                <article>
                  <span className="goal-icon">☾</span>
                  <div>
                    <b>الوتر هذا الأسبوع</b>
                    <small>بقي ٣ أيام لإكمال هدفك</small>
                    <div className="tiny-progress">
                      <i style={{ width: "57%" }} />
                    </div>
                  </div>
                  <strong>٤ / ٧</strong>
                </article>
                <article>
                  <span className="goal-icon quran-goal">۝</span>
                  <div>
                    <b>ورد القرآن الشهري</b>
                    <small>٢٤ صفحة من ٦٠</small>
                    <div className="tiny-progress gold">
                      <i style={{ width: "40%" }} />
                    </div>
                  </div>
                  <strong>٤٠٪</strong>
                </article>
                <article>
                  <span className="goal-icon heart-goal">♡</span>
                  <div>
                    <b>صلة الرحم</b>
                    <small>هدف أسبوعي لطيف</small>
                    <div className="tiny-progress coral">
                      <i style={{ width: "50%" }} />
                    </div>
                  </div>
                  <strong>١ / ٢</strong>
                </article>
                {customGoals.map((g) => (
                  <article key={g.title}>
                    <span className="goal-icon">✦</span>
                    <div>
                      <b>{g.title}</b>
                      <small>{g.detail}</small>
                      <div className="tiny-progress">
                        <i style={{ width: "5%" }} />
                      </div>
                    </div>
                    <strong>جديد</strong>
                  </article>
                ))}
              </div>
            </section>
            <section className="night-section">
              <div className="night-copy">
                <span>☾</span>
                <p className="eyebrow">قبل النوم</p>
                <h2>اختتم يومك بسكينة</h2>
                <p>
                  وضوء، أذكار النوم، آية الكرسي، نعمة تشكر الله عليها، ثم نية
                  للفجر.
                </p>
                <button type="button" onClick={() => setFocusMode(true)}>
                  ابدأ روتين الليل ←
                </button>
              </div>
              <div className="reflection">
                <p className="eyebrow">محاسبة خاصة</p>
                <h3>ما أجمل شيء فعلته اليوم؟</h3>
                <textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="اكتب لنفسك كلمة طيبة…"
                  aria-label="محاسبة خاصة"
                />
                <span>هذه المساحة لك وحدك، ولا تدخل في الإحصاءات.</span>
              </div>
            </section>
            <footer>
              ﴿ وَاذْكُر رَّبَّكَ كَثِيرًا وَسَبِّحْ بِالْعَشِيِّ وَالْإِبْكَارِ
              ﴾
            </footer>
          </>
        )}
      </section>
      {showZikr && (
        <aside className="zikr-popover">
          <button
            type="button"
            className="close-zikr"
            onClick={() => setShowZikr(false)}
          >
            ×
          </button>
          <p className="eyebrow">اذكر الله</p>
          <div className="zikr-current">
            <b>{zikrName}</b>
            <strong>{zikrCount}</strong>
          </div>
          <div className="zikr-options">
            {[
              "سبحان الله",
              "الحمد لله",
              "الله أكبر",
              "لا إله إلا الله",
              "أستغفر الله",
              "الصلاة على النبي ﷺ",
              "لا حول ولا قوة إلا بالله",
            ].map((item) => (
              <button
                type="button"
                onClick={() => {
                  setZikrName(item);
                  setZikrCount(0);
                }}
                key={item}
              >
                {item}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="zikr-tap"
            onClick={() => setZikrCount((c) => c + 1)}
          >
            + ١
          </button>
        </aside>
      )}
      <button
        type="button"
        className="zikr-fab"
        onClick={() => setShowZikr(!showZikr)}
      >
        ☷ <span>اذكر الله</span>
      </button>
      <nav className="bottom-nav">
        {NAV_ITEMS.map(([id, icon, label]) => (
          <button
            type="button"
            onClick={() => setActive(id)}
            className={active === id ? "active" : ""}
            key={id}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </nav>
    </main>
  );
}
