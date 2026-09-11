"use client";

import { useEffect, useMemo, useState } from "react";
import { SURAH_NAMES } from "../../lib/data/surahs";
import {
  ayahCounts,
  ayahKey,
  loadQuran,
  normalizeAr,
  searchAyahs,
  type Ayah,
} from "../../lib/quran";
import { useStoredState } from "../../lib/use-stored-state";
import { useT } from "../../lib/i18n";

export function QuranReader() {
  const t = useT();
  const [ayahs, setAyahs] = useState<Ayah[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [surah, setSurah] = useState(1);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [bookmark, setBookmark] = useStoredState("wird-quran-bookmark-v1", { surah: 1, ayah: 1 });
  const [memorized, setMemorized] = useStoredState<string[]>("wird-quran-mem-v1", []);
  const [fontSize, setFontSize] = useStoredState("wird-quran-font-v1", 18);

  useEffect(() => {
    let live = true;
    loadQuran()
      .then((a) => {
        if (live) setAyahs(a);
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query), 200);
    return () => window.clearTimeout(id);
  }, [query]);

  const counts = useMemo(() => (ayahs ? ayahCounts(ayahs) : []), [ayahs]);
  const verses = useMemo(
    () => (ayahs ? ayahs.filter((a) => a.surah === surah) : []),
    [ayahs, surah],
  );
  const results = useMemo(
    () => (ayahs && debounced.trim().length >= 2 ? searchAyahs(ayahs, debounced) : []),
    [ayahs, debounced],
  );
  const surahHits = useMemo(() => {
    const q = normalizeAr(query);
    if (q.length < 1) return null;
    return SURAH_NAMES.map((n, i) => ({ n, i: i + 1 }))
      .filter(({ n }) => normalizeAr(n).includes(q))
      .slice(0, 8);
  }, [query]);

  const toggleMem = (key: string) =>
    setMemorized((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));

  if (failed)
    return (
      <article className="lib-card">
        <h3>{t("qr.failT")}</h3>
        <p>{t("qr.failS")}</p>
        <button type="button" onClick={() => window.location.reload()}>
          {t("qr.retry")}
        </button>
      </article>
    );
  if (!ayahs) return <p className="chart-caption">{t("qr.loading")}</p>;

  return (
    <div className="quran-reader">
      <div className="lib-toolbar">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("qr.search")}
          aria-label={t("qr.searchAria")}
        />
        <div className="font-ctl">
          <button
            type="button"
            onClick={() => setFontSize((f) => Math.max(14, f - 2))}
            aria-label={t("qr.fontDown")}
          >
            −
          </button>
          <button
            type="button"
            onClick={() => setFontSize((f) => Math.min(28, f + 2))}
            aria-label={t("qr.fontUp")}
          >
            +
          </button>
        </div>
      </div>
      {debounced.trim().length >= 2 ? (
        <div className="lib-results">
          {surahHits && surahHits.length > 0 && (
            <div className="surah-chips">
              {surahHits.map(({ n, i }) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setSurah(i);
                    setQuery("");
                  }}
                >
                  {i}. {n}
                </button>
              ))}
            </div>
          )}
          {results.length === 0 && <p className="chart-caption">{t("qr.noRes")}</p>}
          {results.map((a) => (
            <button
              key={ayahKey(a.surah, a.ayah)}
              type="button"
              className="ayah-hit"
              onClick={() => {
                setSurah(a.surah);
                setBookmark({ surah: a.surah, ayah: a.ayah });
                setQuery("");
              }}
            >
              <b>
                {SURAH_NAMES[a.surah - 1]} · {a.ayah}
              </b>
              <span>{a.text}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="surah-picker">
            <select
              value={surah}
              onChange={(e) => setSurah(Number(e.target.value))}
              aria-label={t("qr.surahAria")}
            >
              {SURAH_NAMES.map((n, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}. {n} ({counts[i + 1] ?? 0})
                </option>
              ))}
            </select>
            <span className="lib-hint">
              {t("qr.markLine")}: {SURAH_NAMES[(bookmark.surah ?? 1) - 1]} · {bookmark.ayah ?? 1} ·{" "}
              {memorized.length} {t("qr.memCount")}
            </span>
          </div>
          <article className="mushaf" style={{ fontSize }}>
            <h3>سورة {SURAH_NAMES[surah - 1]}</h3>
            {verses.map((a) => {
              const key = ayahKey(a.surah, a.ayah);
              const isMark = bookmark.surah === a.surah && bookmark.ayah === a.ayah;
              return (
                <span
                  key={key}
                  className={`ayah${memorized.includes(key) ? " mem" : ""}${isMark ? " mark" : ""}`}
                >
                  {a.text}
                  <b className="ayah-end">۝{a.ayah}</b>
                  <span className="ayah-tools">
                    <button
                      type="button"
                      onClick={() => setBookmark({ surah: a.surah, ayah: a.ayah })}
                      aria-label={t("qr.mark")}
                    >
                      🔖
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleMem(key)}
                      aria-pressed={memorized.includes(key)}
                      aria-label={t("qr.mem")}
                    >
                      {memorized.includes(key) ? "★" : "☆"}
                    </button>
                  </span>
                </span>
              );
            })}
          </article>
        </>
      )}
    </div>
  );
}
