"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SURAH_NAMES } from "../../lib/data/surahs";
import {
  ayahCounts,
  ayahKey,
  loadEnglish,
  loadQuran,
  normalizeAr,
  searchAyahs,
  type Ayah,
} from "../../lib/quran";
import { fetchTafsir, TAFSIRS } from "../../lib/tafsir";
import { ayahAudioUrl, RECITERS } from "../../lib/audio";
import { useStoredState } from "../../lib/use-stored-state";
import { useT } from "../../lib/i18n";
import { useWird } from "../wird-store";

export function QuranReader() {
  const t = useT();
  const { lang } = useWird();
  const [ayahs, setAyahs] = useState<Ayah[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [surah, setSurah] = useState(1);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [bookmark, setBookmark] = useStoredState("wird-quran-bookmark-v1", { surah: 1, ayah: 1 });
  const [memorized, setMemorized] = useStoredState<string[]>("wird-quran-mem-v1", []);
  const [fontSize, setFontSize] = useStoredState("wird-quran-font-v1", 18);
  const [showEn, setShowEn] = useStoredState("wird-quran-en-v1", false);
  const [enMap, setEnMap] = useState<Map<string, string> | null>(null);
  const [reciter, setReciter] = useStoredState("wird-reciter-v1", RECITERS[0]?.id ?? "");
  const [playing, setPlaying] = useState<{ surah: number; ayah: number } | null>(null);
  const [tafsirFor, setTafsirFor] = useState<{ surah: number; ayah: number } | null>(null);
  const [tafsirSrc, setTafsirSrc] = useStoredState("wird-tafsir-src-v1", TAFSIRS[0]?.id ?? "");
  const [tafsirText, setTafsirText] = useState<string | null>(null);
  const [tafsirState, setTafsirState] = useState<"idle" | "loading" | "error">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
    if (!showEn || enMap) return;
    let live = true;
    loadEnglish()
      .then((m) => {
        if (live) setEnMap(m);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [showEn, enMap]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query), 200);
    return () => window.clearTimeout(id);
  }, [query]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!playing) {
      audio.pause();
      return;
    }
    audio.src = ayahAudioUrl(reciter, playing.surah, playing.ayah);
    void audio.play().catch(() => setPlaying(null));
  }, [playing, reciter]);

  useEffect(() => {
    if (!playing) return;
    try {
      document
        .getElementById(`ayah-${playing.surah}-${playing.ayah}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch {}
  }, [playing]);

  useEffect(() => {
    if (!tafsirFor) return;
    let live = true;
    fetchTafsir(tafsirSrc, tafsirFor.surah, tafsirFor.ayah)
      .then((text) => {
        if (live) {
          setTafsirText(text);
          setTafsirState("idle");
        }
      })
      .catch(() => {
        if (live) setTafsirState("error");
      });
    return () => {
      live = false;
    };
  }, [tafsirFor, tafsirSrc]);

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

  const openTafsir = (surah: number, ayah: number) => {
    setTafsirText(null);
    setTafsirState("loading");
    setTafsirFor({ surah, ayah });
  };

  const stopAudio = () => setPlaying(null);
  const stepAyah = (dir: 1 | -1) => {
    if (!playing) return;
    const total = counts[playing.surah] ?? 0;
    const next = playing.ayah + dir;
    if (next < 1 || next > total) {
      setPlaying(null);
      return;
    }
    setPlaying({ surah: playing.surah, ayah: next });
  };

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
        <button
          type="button"
          onClick={() => setShowEn((v) => !v)}
          aria-pressed={showEn}
          className={showEn ? "selected" : ""}
        >
          EN
        </button>
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
      <div className="lib-toolbar">
        <select
          value={reciter}
          onChange={(e) => setReciter(e.target.value)}
          aria-label={t("qr.reciter")}
        >
          {RECITERS.map((r) => (
            <option key={r.id} value={r.id}>
              {lang === "ar" ? r.ar : r.en}
            </option>
          ))}
        </select>
        {playing && (
          <div className="audio-bar">
            <button type="button" onClick={() => stepAyah(-1)} aria-label={t("qr.prev")}>
              ‹
            </button>
            <button
              type="button"
              onClick={() => {
                const a = audioRef.current;
                if (!a) return;
                if (a.paused) void a.play().catch(() => {});
                else a.pause();
              }}
              aria-label={t("qr.play")}
            >
              ⏸
            </button>
            <button type="button" onClick={() => stepAyah(1)} aria-label={t("qr.next")}>
              ›
            </button>
            <button type="button" onClick={stopAudio} aria-label={t("qr.close")}>
              ×
            </button>
            <span>
              {t("qr.playing")}: {SURAH_NAMES[playing.surah - 1]} {playing.ayah}
            </span>
          </div>
        )}
      </div>
      <audio
        ref={audioRef}
        preload="none"
        onEnded={() => {
          if (!playing) return;
          const total = counts[playing.surah] ?? 0;
          if (playing.ayah >= total) setPlaying(null);
          else setPlaying({ surah: playing.surah, ayah: playing.ayah + 1 });
        }}
      />
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
              onChange={(e) => {
                setSurah(Number(e.target.value));
                stopAudio();
              }}
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
              const isPlaying = playing?.surah === a.surah && playing?.ayah === a.ayah;
              return (
                <span
                  key={key}
                  id={`ayah-${a.surah}-${a.ayah}`}
                  className={`ayah${memorized.includes(key) ? " mem" : ""}${isMark ? " mark" : ""}${
                    isPlaying ? " playing" : ""
                  }`}
                >
                  {a.text}
                  <b className="ayah-end">۝{a.ayah}</b>
                  {showEn && enMap?.get(key) && <span className="ayah-en">{enMap.get(key)}</span>}
                  <span className="ayah-tools">
                    <button
                      type="button"
                      onClick={() => setPlaying({ surah: a.surah, ayah: a.ayah })}
                      aria-label={t("qr.play")}
                    >
                      ▶
                    </button>
                    <button
                      type="button"
                      onClick={() => openTafsir(a.surah, a.ayah)}
                      aria-label={t("qr.tafsir")}
                    >
                      📖
                    </button>
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
      {tafsirFor && (
        <div className="tafsir-sheet" role="dialog" aria-label={t("qr.tafsir")}>
          <div className="tafsir-head">
            <b>
              {SURAH_NAMES[tafsirFor.surah - 1]} · {tafsirFor.ayah}
            </b>
            <button type="button" onClick={() => setTafsirFor(null)} aria-label={t("qr.close")}>
              ×
            </button>
          </div>
          <div className="book-chips">
            {TAFSIRS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setTafsirText(null);
                  setTafsirState("loading");
                  setTafsirSrc(s.id);
                }}
                aria-pressed={tafsirSrc === s.id}
                className={tafsirSrc === s.id ? "selected" : ""}
              >
                {lang === "ar" ? s.ar : s.en}
                {s.offline ? " ✓" : ""}
              </button>
            ))}
          </div>
          {tafsirState === "loading" && <p className="chart-caption">{t("qr.tafsirLoad")}</p>}
          {tafsirState === "error" && <p className="chart-caption">{t("qr.tafsirFail")}</p>}
          {tafsirState === "idle" && tafsirText && <p className="tafsir-text">{tafsirText}</p>}
        </div>
      )}
    </div>
  );
}
