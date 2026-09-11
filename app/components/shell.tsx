"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { NAV_HREFS, NAV_ITEMS } from "../lib/wird";
import { isVoiceSupported, listenOnce, matchCommand } from "../lib/voice";
import { useWird } from "./wird-store";

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const {
    hijriLabel,
    gregLabel,
    showZikr,
    setShowZikr,
    zikrCount,
    setZikrCount,
    zikrName,
    setZikrName,
    toggle,
    setTasbeeh,
    setFastType,
  } = useWird();
  const [voiceOn, setVoiceOn] = useState(false);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- feature-detect once after mount (SSR has no window)
    setVoiceOn(isVoiceSupported());
  }, []);
  useEffect(() => {
    if (!heard) return;
    const id = window.setTimeout(() => setHeard(""), 4000);
    return () => window.clearTimeout(id);
  }, [heard]);
  const runVoice = async () => {
    if (listening) return;
    setListening(true);
    try {
      const text = await listenOnce();
      if (!text) {
        setHeard("لم أسمع شيئًا — حاول مجددًا");
        return;
      }
      const cmd = matchCommand(text);
      if (!cmd) {
        setHeard(`سمعت: «${text}» — جرّب: سجلت الفجر`);
        return;
      }
      if (cmd === "tasbeeh-plus") setTasbeeh((c) => Math.min(33, c + 1));
      else if (cmd === "fast-log") setFastType((cur) => cur ?? "نافلة");
      else toggle(cmd);
      setHeard(`✓ سُجّل: ${text}`);
    } finally {
      setListening(false);
    }
  };
  const isActive = (id: string) => {
    const href = NAV_HREFS[id] ?? "/";
    return href === "/" ? pathname === "/" : (pathname?.startsWith(href) ?? false);
  };
  return (
    <main>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">و</span>
          <span>وِرد</span>
        </div>
        <nav>
          {NAV_ITEMS.map(([id, icon, label]) => (
            <Link
              key={id}
              href={NAV_HREFS[id] ?? "/"}
              className={isActive(id) ? "nav-item active" : "nav-item"}
            >
              <span>{icon}</span>
              {label}
            </Link>
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
          <Link href="/account" className="profile">
            <span>م</span>
            <div>
              محمد عبدالله<small>الحمدلله دائمًا</small>
            </div>
            <i>⌄</i>
          </Link>
        </div>
      </aside>
      <section className="content">
        <header>
          <div>
            <p className="eyebrow">{hijriLabel || "يوم جديد"}</p>
            <h1>
              صباح النور، محمد <span>☀</span>
            </h1>
            <p className="subhead">كل خطوة صغيرة تقرّبك. جعل الله يومك عامرًا بذكره.</p>
          </div>
          <div className="header-actions">
            <Link href="/calendar" className="date-button">
              ‹ <span>اليوم</span> {gregLabel} ›
            </Link>
            {voiceOn && (
              <button
                type="button"
                className="mic-btn"
                onClick={() => void runVoice()}
                aria-pressed={listening}
                aria-label="تسجيل صوتي"
                title="قل: سجلت الفجر"
              >
                {listening ? "…" : "🎙"}
              </button>
            )}
          </div>
          {heard && <p className="heard-msg">{heard}</p>}
        </header>
        {children}
      </section>
      {showZikr && (
        <aside className="zikr-popover">
          <button type="button" className="close-zikr" onClick={() => setShowZikr(false)}>
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
          <button type="button" className="zikr-tap" onClick={() => setZikrCount((c) => c + 1)}>
            + ١
          </button>
        </aside>
      )}
      <button type="button" className="zikr-fab" onClick={() => setShowZikr(!showZikr)}>
        ☷ <span>اذكر الله</span>
      </button>
      <nav className="bottom-nav">
        {NAV_ITEMS.map(([id, icon, label]) => (
          <Link href={NAV_HREFS[id] ?? "/"} className={isActive(id) ? "active" : ""} key={id}>
            <span>{icon}</span>
            {label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
