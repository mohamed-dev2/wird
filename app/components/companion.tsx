"use client";

// Companion UI (§2): ONE adaptive card max. Quran / Hadith / Wird-guidance
// are visually AND semantically separated (2.61, 2.8): distinct labels,
// distinct blocks, never mixed. Unresolvable content renders NOTHING (2.10).

import { useEffect, useState } from "react";
import { resolveHadith, resolveVerse, surahNameAr } from "../lib/content";
import { useT } from "../lib/i18n";
import type { Guidance } from "../lib/companion";
import type { Lang } from "./wird-store";

function readLocale(): Lang {
  try {
    return document.documentElement.dir === "ltr" ? "en" : "ar";
  } catch {
    return "ar";
  }
}

export function VerseCard({ surah, ayah }: { surah: number; ayah: number }) {
  const t = useT();
  const [lang, setLang] = useState<Lang>("ar");
  const [ready, setReady] = useState(false);
  const [verse, setVerse] = useState<{ ar: string; en: string | null } | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-once locale + verified verse load (renders nothing pre-mount, matches SSR)
    setLang(readLocale());
    let live = true;
    void resolveVerse(surah, ayah).then((v) => {
      if (!live) return;
      if (!v) setMissing(true);
      else setVerse({ ar: v.ar, en: v.en });
      setReady(true);
    });
    return () => {
      live = false;
    };
  }, [surah, ayah]);
  // Hydration-safe + authenticity-first: nothing until verified loaded.
  if (!ready || missing || !verse) return null;
  const ref = lang === "ar" ? `${surahNameAr(surah)} · ${ayah}` : `Quran · ${surah}:${ayah}`;
  return (
    <blockquote className="cm-verse" aria-label={t("cm.quran")}>
      <p className="cm-label">{t("cm.quran")}</p>
      <p>﴿{verse.ar}﴾</p>
      {verse.en && (
        <p className="cm-en" dir="ltr">
          {verse.en}
        </p>
      )}
      <cite dir={lang === "ar" ? "rtl" : "ltr"}>{ref}</cite>
    </blockquote>
  );
}

export function HadithCard({ book, id }: { book: string; id: string }) {
  const t = useT();
  let resolved: ReturnType<typeof resolveHadith> = null;
  try {
    resolved = resolveHadith(book, id);
  } catch {
    resolved = null;
  }
  if (!resolved) return null;
  return (
    <blockquote className="cm-hadith" aria-label={t("cm.hadith")}>
      <p className="cm-label">
        {t("cm.hadith")} · {resolved.book} · {resolved.grade} · {resolved.ref}
      </p>
      <p>{resolved.text}</p>
      <p className="cm-en" dir="ltr">
        {resolved.en}
      </p>
    </blockquote>
  );
}

export function CompanionCard({
  guidance,
  verse,
  hadith,
  overlayNote,
  coreTitles,
  contextLine,
  onAction,
  onDismiss,
}: {
  guidance: Guidance;
  verse: { surah: number; ayah: number } | null;
  hadith: { book: string; id: string } | null;
  overlayNote: string | null;
  coreTitles: string[];
  contextLine: string | null;
  onAction: (g: Guidance) => void;
  onDismiss: () => void;
}) {
  const t = useT();
  return (
    <section className="companion-card" aria-live="polite">
      <p className="cm-label">{t("cm.guide")}</p>
      <h2>{t(guidance.titleKey, guidance.vars)}</h2>
      <p>{t(guidance.bodyKey, guidance.vars)}</p>
      {guidance.reasonKey && <p className="cm-why">{t(guidance.reasonKey, guidance.reasonVars)}</p>}
      {contextLine && <p className="cm-merge">{contextLine}</p>}
      {overlayNote && <p className="cm-merge">{overlayNote}</p>}
      {verse && <VerseCard surah={verse.surah} ayah={verse.ayah} />}
      {hadith && <HadithCard book={hadith.book} id={hadith.id} />}
      {guidance.action === "core" && coreTitles.length > 0 && (
        <p className="cm-core">
          {t("cm.coreT")}: {coreTitles.join(" · ")}
        </p>
      )}
      <div className="backup-actions">
        {guidance.action !== "none" && (
          <button type="button" className="review-submit" onClick={() => onAction(guidance)}>
            {t(`cm.act.${guidance.action}`)}
          </button>
        )}
        <button type="button" className="linklike" onClick={onDismiss}>
          {t("cm.act.none")}
        </button>
      </div>
    </section>
  );
}
