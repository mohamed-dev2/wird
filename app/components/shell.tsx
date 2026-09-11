"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { NAV_HREFS, NAV_ITEMS } from "../lib/wird";
import { useT } from "../lib/i18n";
import { LoginGate } from "./login-gate";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
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
    activeProfile,
    authReady,
    unlocked,
    profileName,
    greeting,
    autoLock,
    lock,
  } = useWird();
  const t = useT();
  const [voiceOn, setVoiceOn] = useState(false);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- feature-detect once after mount (SSR has no window)
    setVoiceOn(isVoiceSupported());
  }, []);
  useEffect(() => {
    // Subtle pointer tilt for [data-tilt] cards: desktop pointers only,
    // disabled with reduced motion. Delegated — survives route changes.
    let last: HTMLElement | null = null;
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
    const move = (e: PointerEvent) => {
      const el = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest?.("[data-tilt]") as HTMLElement | null;
      if (last && last !== el) clear();
      last = el;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--ry", `${(px * 11).toFixed(2)}deg`);
      el.style.setProperty("--rx", `${(-py * 11).toFixed(2)}deg`);
      el.style.setProperty("--mx", `${((px + 0.5) * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${((py + 0.5) * 100).toFixed(1)}%`);
    };
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", clear);
    return () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", clear);
    };
  }, []);
  useEffect(() => {
    if (!heard) return;
    const id = window.setTimeout(() => setHeard(""), 4000);
    return () => window.clearTimeout(id);
  }, [heard]);
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
  const runVoice = async () => {
    if (listening) return;
    setListening(true);
    try {
      const text = await listenOnce();
      if (!text) {
        setHeard(t("header.heardFail"));
        return;
      }
      const cmd = matchCommand(text);
      if (!cmd) {
        setHeard(t("header.heardTry", { t: text }));
        return;
      }
      if (cmd === "tasbeeh-plus") setTasbeeh((c) => Math.min(33, c + 1));
      else if (cmd === "fast-log") setFastType((cur) => cur ?? "نافلة");
      else toggle(cmd);
      setHeard(t("header.heardOk", { t: text }));
    } finally {
      setListening(false);
    }
  };
  const isActive = (id: string) => {
    const href = NAV_HREFS[id] ?? "/";
    return href === "/" ? pathname === "/" : (pathname?.startsWith(href) ?? false);
  };
  if (!authReady || !activeProfile || (activeProfile.pinHash && !unlocked)) {
    return <LoginGate />;
  }
  return (
    <main>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">و</span>
          <span>وِرد</span>
        </div>
        <nav>
          {NAV_ITEMS.map(([id, icon]) => (
            <Link
              key={id}
              href={NAV_HREFS[id] ?? "/"}
              className={isActive(id) ? "nav-item active" : "nav-item"}
            >
              <span>{icon}</span>
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
      <section className="content">
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
            {voiceOn && (
              <button
                type="button"
                className="mic-btn"
                onClick={() => void runVoice()}
                aria-pressed={listening}
                aria-label={t("header.voice")}
                title={t("header.voice")}
              >
                {listening ? "…" : "🎙"}
              </button>
            )}
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
          {heard && <p className="heard-msg">{heard}</p>}
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
