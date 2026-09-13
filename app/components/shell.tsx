// Shell: sidebar/nav/header/zikr chrome + login gating. Owns cross-cutting
// effects only: pointer-tilt delegation, auto-lock timer, install prompt.
// Never reads feature state during render.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { NAV_HREFS, NAV_ITEMS } from "../lib/wird";
import { useT } from "../lib/i18n";
import { LoginGate } from "./login-gate";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
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
    activeProfile,
    authReady,
    unlocked,
    profileName,
    greeting,
    autoLock,
    lock,
  } = useWird();
  const t = useT();
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);
  useEffect(() => {
    // Subtle pointer tilt for [data-tilt] cards: desktop pointers only,
    // disabled with reduced motion. Delegated — survives route changes.
    let last: HTMLElement | null = null;
    let queued = false;
    try {
      if (!window.matchMedia("(pointer: fine)").matches) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    } catch {
      return;
    }
    const clear = () => {
      if (last) {
        last.style.setProperty("--rx", "0deg");
        last.style.setProperty("--ry", "0deg");
        last = null;
      }
    };
    const applyTilt = (clientX: number, clientY: number) => {
      const el = document
        .elementFromPoint(clientX, clientY)
        ?.closest?.("[data-tilt]") as HTMLElement | null;
      if (last && last !== el) clear();
      last = el;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const px = (clientX - r.left) / r.width - 0.5;
      const py = (clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--ry", `${(px * 11).toFixed(2)}deg`);
      el.style.setProperty("--rx", `${(-py * 11).toFixed(2)}deg`);
      el.style.setProperty("--mx", `${((px + 0.5) * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${((py + 0.5) * 100).toFixed(1)}%`);
    };
    const move = (e: PointerEvent) => {
      // Coalesce to one style write per frame: per-event writes jank.
      if (queued) return;
      queued = true;
      const { clientX, clientY } = e;
      window.requestAnimationFrame(() => {
        queued = false;
        applyTilt(clientX, clientY);
      });
    };
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", clear);
    return () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", clear);
    };
  }, []);
  useEffect(() => {
    if (!autoLock || autoLock <= 0) return;
    let id: number | undefined;
    const arm = () => {
      window.clearTimeout(id);
      id = window.setTimeout(() => lock(), autoLock * 60000);
    };
    const evts = ["pointerdown", "keydown", "touchstart"] as const;
    evts.forEach((e) => window.addEventListener(e, arm, { passive: true }));
    arm();
    return () => {
      window.clearTimeout(id);
      evts.forEach((e) => window.removeEventListener(e, arm));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lock is stable in practice (storage + stable setter)
  }, [autoLock]);
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);
  // Panic lock: triple-tap the brand mark within 1.5s to lock instantly.
  // Discoverable only to those who know — no visible control to explain.
  const tapsRef = useRef<number[]>([]);
  useEffect(() => {
    // Privacy screen: blur app content while the tab is hidden (shoulder
    // surfing via task switchers / screen share). Blur, NOT lock — locking
    // here would break copy-paste transfer flows across tabs/apps.
    const onVis = () => {
      try {
        document.body.classList.toggle("tab-hidden", document.hidden);
      } catch {}
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
  useEffect(() => {
    // Idle blur: 60s without pointer/keyboard softens content (distinct from
    // auto-lock, which fully locks). Any interaction lifts it instantly.
    let id: number | undefined;
    const unblur = () => {
      try {
        document.body.classList.remove("idle-blur");
      } catch {}
      window.clearTimeout(id);
      id = window.setTimeout(() => {
        try {
          document.body.classList.add("idle-blur");
        } catch {}
      }, 60000);
    };
    const evts = ["pointerdown", "keydown", "touchstart", "wheel"] as const;
    evts.forEach((e) => window.addEventListener(e, unblur, { passive: true }));
    unblur();
    return () => {
      window.clearTimeout(id);
      evts.forEach((e) => window.removeEventListener(e, unblur));
    };
  }, []);
  const isActive = (id: string) => {
    const href = NAV_HREFS[id] ?? "/";
    return href === "/" ? pathname === "/" : (pathname?.startsWith(href) ?? false);
  };
  if (!authReady || !activeProfile || (activeProfile.pinHash && !unlocked)) {
    return <LoginGate />;
  }
  const panicTap = () => {
    try {
      const now = Date.now();
      const taps = [...tapsRef.current.filter((t) => now - t < 1500), now];
      tapsRef.current = taps;
      if (taps.length >= 3) {
        tapsRef.current = [];
        lock();
      }
    } catch {}
  };
  return (
    <main>
      <a href="#main-content" className="skip-link">
        {t("nav.skip")}
      </a>
      <aside className="sidebar">
        <div
          className="brand"
          onClick={panicTap}
          role="button"
          tabIndex={0}
          aria-label={t("app.tag")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") panicTap();
          }}
        >
          <span className="brand-mark" aria-hidden>
            و
          </span>
          <span>وِرد</span>
        </div>
        <nav>
          {NAV_ITEMS.map(([id, icon]) => (
            <Link
              key={id}
              href={NAV_HREFS[id] ?? "/"}
              className={isActive(id) ? "nav-item active" : "nav-item"}
            >
              <span aria-hidden>{icon}</span>
              {t(`nav.${id}`)}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="streak-small">
            <span>🔥</span>
            <div>
              <b>{t("side.streak")}</b>
              <small>{t("side.streakSub")}</small>
            </div>
          </div>
          <Link href="/account" className="profile">
            <span>{activeProfile.avatar}</span>
            <div>
              {profileName}
              <small>{t("side.profileSub")}</small>
            </div>
            <i>⌄</i>
          </Link>
        </div>
      </aside>
      <section className="content" id="main-content" tabIndex={-1}>
        <header>
          <div>
            <p className="eyebrow">{hijriLabel || t("header.newDay")}</p>
            <h1>
              {greeting} <span>☀</span>
            </h1>
            <p className="subhead">{t("header.sub")}</p>
          </div>
          <div className="header-actions">
            <Link href="/calendar" className="date-button">
              ‹ <span>{t("header.today")}</span> {gregLabel} ›
            </Link>
            {installEvt && (
              <button
                type="button"
                className="mic-btn"
                aria-label={t("pwa.install")}
                title={t("pwa.install")}
                onClick={() => {
                  const ev = installEvt;
                  setInstallEvt(null);
                  void ev.prompt().catch(() => undefined);
                }}
              >
                📲
              </button>
            )}
          </div>
        </header>
        {children}
      </section>
      {showZikr && (
        <aside className="zikr-popover">
          <button
            type="button"
            className="close-zikr"
            onClick={() => setShowZikr(false)}
            aria-label={t("zk.close")}
          >
            ×
          </button>
          <p className="eyebrow">{t("zk.title")}</p>
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
        ☷ <span>{t("zk.title")}</span>
      </button>
      <nav className="bottom-nav">
        {NAV_ITEMS.map(([id, icon]) => (
          <Link href={NAV_HREFS[id] ?? "/"} className={isActive(id) ? "active" : ""} key={id}>
            <span>{icon}</span>
            {t(`nav.${id}`)}
          </Link>
        ))}
      </nav>
    </main>
  );
}
