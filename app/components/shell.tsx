"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { NAV_HREFS, NAV_ITEMS } from "../lib/wird";
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
  } = useWird();
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
          <Link href="/calendar" className="date-button">
            ‹ <span>اليوم</span> {gregLabel} ›
          </Link>
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
