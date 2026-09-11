"use client";

import { useWird } from "./components/wird-store";
import { NowView } from "./components/views/now";
import { type CSSProperties } from "react";
import {
  sections,
  extras,
  adhkar,
  duas,
  QURAN_GOAL_PAGES,
  PRAYER_NAMES,
  FAST_TYPES,
  dayId,
} from "./lib/wird";

export default function TodayPage() {
  const {
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
    isFriday,
    addCustom,
    addDua,
    addGoal,
    editIntention,
    cycleFilter,
    filterLabel,
    passFilter,
    scrollToQuran,
  } = useWird();
  return (
    <>
      {ramadan && (
        <section className="ramadan-banner">
          <span>🌙</span>
          <div>
            <b>رمضان كريم — تقبل الله طاعتكم</b>
            <p>التراويح والقيام في انتظارك الليلة.</p>
          </div>
          <button
            type="button"
            onClick={() => toggle("taraweeh")}
            aria-pressed={done.includes("taraweeh")}
          >
            {done.includes("taraweeh") ? "✓ صليت التراويح" : "سجل التراويح"}
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
          <p className="eyebrow">لحظة واحدة تكفي</p>
          <h2>هل أوترت اليوم؟</h2>
          <p>ركعة واحدة قد تكون أجمل ختام ليومك.</p>
          <button
            type="button"
            className="focus-action"
            onClick={() => toggle("witr")}
            aria-pressed={done.includes("witr")}
          >
            {done.includes("witr") ? "✓ تم تسجيل الوتر" : "سجّل الوتر الآن"}
          </button>
        </section>
      ) : (
        <>
          <section className="hero">
            <div className="hero-copy">
              <span className="pill">رحلتك اليوم · يوم {dayMode}</span>
              <h2>أنت تصنع أثرًا جميلًا</h2>
              <p>
                أكملت <b>{completed}</b> من {total} وردًا اليوم. استمر، فالقليل الدائم أحبّ إلى
                الله.
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
                  {total ? Math.round((completed / total) * 100) : 0}% <small>إنجاز اليوم</small>
                </b>
                <b>
                  {completedPoints} / {totalPoints} <small>نقطة بركة</small>
                </b>
              </div>
            </div>
            <div className="hero-ring" style={{ "--ring": ringDeg } as CSSProperties}>
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
                    setMinimumPlan(mode === "مشغول" || mode === "سفر" || mode === "مرض");
                  }}
                  className={dayMode === mode ? "selected" : ""}
                  key={mode}
                >
                  {mode}
                </button>
              ))}
              <button type="button" className="focus-trigger" onClick={() => setFocusMode(true)}>
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
                  {done.includes("morning") ? "✓ تم تسجيلها" : "ابدأ الآن ←"}
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
                          className={selectedMinutes === minute ? "selected" : ""}
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
                  {done.includes("daily-dua") ? "✓ دعوت به اليوم" : "دعوت به اليوم"}
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
                <p>تقدّمك هادئ وثابت. يمكنك التوقف أو تقليل الهدف متى شئت.</p>
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
                  {["طلب الرزق الحلال", "إتقان العمل", "نفع الناس", "التعلم", "إعانة الأسرة"].map(
                    (item) => (
                      <button
                        type="button"
                        key={item}
                        onClick={() => setIntention(item)}
                        aria-pressed={intention === item}
                        className={intention === item ? "selected" : ""}
                      >
                        {item}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </article>
          </section>
          <section className="friday-card">
            <span>☾</span>
            <div>
              <p className="eyebrow">رفيق الجمعة {isFriday ? "· اليوم" : "· خطتك القادمة"}</p>
              <h3>{isFriday ? "جمعة مباركة، وردك ينتظرك" : "ورد الجمعة بانتظارك"}</h3>
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
                <p className="eyebrow">مفضلة المستخدم</p>
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
          <section className="struggle-grid">
            <article className="qada-card">
              <p className="eyebrow">قضاء الفوائت</p>
              <h3>{qadaOpen === 0 ? "لا فوائت — ما شاء الله" : `عليك ${qadaOpen} صلوات`}</h3>
              <div className="qada-add">
                {PRAYER_NAMES.map((p) => (
                  <button key={p} type="button" onClick={() => addQada(p)}>
                    + {p}
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
                      aria-label="حذف"
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
                  مسح المقضية
                </button>
              )}
            </article>
            <article className="fast-card">
              <p className="eyebrow">صيام اليوم</p>
              <h3>{fastType ? `صائم: ${fastType}` : "لست صائمًا اليوم"}</h3>
              <div className="fast-types">
                {FAST_TYPES.map((f) => (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={fastType === f}
                    className={fastType === f ? "selected" : ""}
                    onClick={() => setFastType((cur) => (cur === f ? null : f))}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </article>
            <article className="breaker-card">
              <p className="eyebrow">كسر عادة سيئة</p>
              {!breaker ? (
                <>
                  <h3>اختر عادة تتوب منها اليوم</h3>
                  <button type="button" onClick={startBreaker}>
                    + ابدأ التحدي
                  </button>
                </>
              ) : (
                <>
                  <h3>
                    {breaker.name} — {breakerCleanDays} يوم نظيف 🔥
                  </h3>
                  <p>زلّات مسجلة: {breaker.slips.length}</p>
                  <div className="breaker-actions">
                    <button type="button" onClick={logSlip}>
                      سجل زلة (واستغفر)
                    </button>
                    <button
                      type="button"
                      className="linklike"
                      onClick={() => {
                        try {
                          if (window.confirm("حذف تحدي كسر العادة؟")) setBreaker(null);
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
                <p>الصلوات، ذكر قصير، آية واحدة، استغفار ١٠ مرات، والوتر. هذا يكفي لليوم.</p>
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
          <button type="button" aria-label="تعديل النية" onClick={editIntention}>
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
                className={done.includes(habit.id) ? "extra done" : "extra"}
                key={habit.id}
              >
                <span className="extra-check">{done.includes(habit.id) ? "✓" : "+"}</span>
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
              <p className="eyebrow">مساحتك الخاصة</p>
              <h2>دعائي اليوم</h2>
            </div>
            <span>☾</span>
          </div>
          <p className="dua-feature">“اللهم أعنّي على ذكرك وشكرك وحسن عبادتك.”</p>
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
          <p>فاتك شيء؟ لا بأس. اختر عملًا صغيرًا الآن، والله يحب العمل الدائم ولو كان قليلًا.</p>
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
          {challenges.map((c) => {
            const pct = Math.min(100, Math.round((c.checks.length / c.target) * 100));
            const todayDone = c.checks.includes(dayId());
            return (
              <article key={c.id}>
                <span className="goal-icon">🏆</span>
                <div>
                  <b>{c.title}</b>
                  <small>
                    {c.checks.length} / {c.target} يوم
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
                    aria-label="تسجيل اليوم"
                  >
                    {todayDone ? "✓" : "+"}
                  </button>
                  <button
                    type="button"
                    className="linklike"
                    onClick={() => removeChallenge(c.id)}
                    aria-label="حذف التحدي"
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
        </div>
      </section>
      <section className="night-section">
        <div className="night-copy">
          <span>☾</span>
          <p className="eyebrow">قبل النوم</p>
          <h2>اختتم يومك بسكينة</h2>
          <p>وضوء، أذكار النوم، آية الكرسي، نعمة تشكر الله عليها، ثم نية للفجر.</p>
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
      <footer>﴿ وَاذْكُر رَّبَّكَ كَثِيرًا وَسَبِّحْ بِالْعَشِيِّ وَالْإِبْكَارِ ﴾</footer>
    </>
  );
}
