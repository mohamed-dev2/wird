// Full 10-book hadith browser: lazy per-book JSON, Arabic + lazy English,
// search, pagination, read/fav/copy per hadith via a floating choice-list
// menu (same pattern as the ayah rows). Favorites/reads persist per profile.

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FULL_BOOKS,
  fullHadithId,
  loadFullBook,
  loadFullBookEn,
  type FullBook,
  type FullBookId,
} from "../../lib/hadith-full";
import { normalizeAr } from "../../lib/quran";
import { topicAr } from "../../lib/data/topics-ar";
import { parseArDigits } from "../../lib/wird";
import { copyText } from "../../lib/clipboard";
import { useT } from "../../lib/i18n";
import { useWird } from "../wird-store";

const PAGE = 25;

export function HadithFull({
  favs,
  toggleFav,
  readIds,
  toggleRead,
  bookId,
  onBookId,
}: {
  favs: string[];
  toggleFav: (id: string) => void;
  readIds: string[];
  toggleRead: (id: string) => void;
  bookId: FullBookId;
  onBookId: (id: FullBookId) => void;
}) {
  const t = useT();
  const { lang } = useWird();
  const [book, setBook] = useState<FullBook | null>(null);
  const [failed, setFailed] = useState(false);
  const [section, setSection] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [jump, setJump] = useState("");
  const [page, setPage] = useState(0);
  // English translation (verified `eng-*` edition): lazy, per book, never
  // blocks Arabic. Defaults on for English UI, toggleable everywhere.
  const [showEn, setShowEn] = useState(lang !== "ar");
  const [enMap, setEnMap] = useState<Map<number, string> | null>(null);
  // One open action menu at a time — same floating choice-list pattern as
  // the ayah rows (trigger reveals, menu floats above the card).
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const pickBook = (id: FullBookId) => {
    setBook(null);
    setFailed(false);
    setSection("all");
    setPage(0);
    setQuery("");
    setEnMap(null);
    onBookId(id);
  };

  useEffect(() => {
    let live = true;
    loadFullBook(bookId)
      .then((b) => {
        if (live) setBook(b);
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, [bookId]);

  useEffect(() => {
    if (!showEn || !book || enMap) return;
    let live = true;
    loadFullBookEn(book.id).then((m) => {
      if (live) setEnMap(m);
    });
    return () => {
      live = false;
    };
  }, [showEn, book, enMap]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebounced(query);
      setPage(0);
    }, 300);
    return () => window.clearTimeout(id);
  }, [query]);

  const filtered = useMemo(() => {
    if (!book) return [];
    let list = book.hadiths;
    if (section !== "all") list = list.filter((h) => String(h.book) === section);
    const q = normalizeAr(debounced.trim());
    const qEn = debounced.trim().toLowerCase();
    if (q.length >= 2)
      list = list.filter(
        (h) =>
          normalizeAr(h.text).includes(q) ||
          (enMap?.get(h.num)?.toLowerCase().includes(qEn) ?? false),
      );
    return list;
  }, [book, section, debounced, enMap]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const safePage = Math.min(page, pages - 1);
  const slice = filtered.slice(safePage * PAGE, safePage * PAGE + PAGE);

  const copy = (text: string, ref: string) => copyText(`${text} — (${ref})`);

  const jumpTo = () => {
    const n = parseInt(parseArDigits(jump), 10);
    if (!Number.isFinite(n) || !book) return;
    const idx = book.hadiths.findIndex((h) => h.num === n);
    if (idx < 0) return;
    let list = book.hadiths;
    if (section !== "all") list = list.filter((h) => String(h.book) === section);
    const pos = list.findIndex((h) => h.num === n);
    if (pos >= 0) {
      setPage(Math.floor(pos / PAGE));
      setQuery("");
      try {
        document.getElementById(`fh-${n}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch {}
    }
  };

  return (
    <div className="hadith-full">
      <div className="book-chips">
        {FULL_BOOKS.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => pickBook(b.id)}
            aria-pressed={bookId === b.id}
            className={bookId === b.id ? "selected" : ""}
          >
            {lang === "ar" ? b.ar : b.en}
          </button>
        ))}
      </div>
      {!book && !failed && <p className="chart-caption">{t("hf.loading")}</p>}
      {failed && (
        <article className="lib-card">
          <h3>{t("hf.failT")}</h3>
          <p>{t("hf.failS")}</p>
          <button
            type="button"
            onClick={() => {
              setFailed(false);
              setBook(null);
              loadFullBook(bookId)
                .then(setBook)
                .catch(() => setFailed(true));
            }}
          >
            {t("qr.retry")}
          </button>
        </article>
      )}
      {book && (
        <>
          <p className="chart-caption">
            {book.ar} · {book.count} {t("hf.count")}
          </p>
          {book.id === "ahmed" && <p className="chart-caption">{t("hf.partialAhmed")}</p>}
          <div className="lib-toolbar">
            <button
              type="button"
              onClick={() => setShowEn((v) => !v)}
              aria-pressed={showEn}
              className={showEn ? "selected" : ""}
            >
              {t("qr.showEn")}
            </button>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("hf.search")}
              aria-label={t("hf.search")}
            />
            <select
              value={section}
              onChange={(e) => {
                setSection(e.target.value);
                setPage(0);
              }}
              aria-label={t("hf.section")}
            >
              <option value="all">{t("hf.sectionAll")}</option>
              {Object.entries(book.sections).map(([id, name]) => (
                <option key={id} value={id}>
                  {lang === "ar" ? topicAr(name) : name}
                </option>
              ))}
            </select>
            <input
              value={jump}
              onChange={(e) => setJump(e.target.value)}
              placeholder={t("hf.jump")}
              aria-label={t("hf.jump")}
              inputMode="numeric"
            />
            <button type="button" onClick={jumpTo}>
              {t("hf.go")}
            </button>
          </div>
          {filtered.length === 0 && <p className="chart-caption">{t("hd.noRes")}</p>}
          {slice.map((h) => {
            const id = fullHadithId(book.id, h.num);
            const read = readIds.includes(id);
            const menuOpen = menuFor === id;
            const en = showEn ? enMap?.get(h.num) : undefined;
            const pick = (fn: () => void) => () => {
              setMenuFor(null);
              fn();
            };
            return (
              <article key={id} id={`fh-${h.num}`} className={`hadith-card${read ? " read" : ""}`}>
                <p>{h.text}</p>
                {en && (
                  <p className="hadith-en" dir="ltr" lang="en">
                    {en}
                  </p>
                )}
                <div className="hadith-meta">
                  <span className="grade-other">
                    {t("hf.num")} {h.num}
                  </span>
                  <span>
                    {lang === "ar"
                      ? topicAr(book.sections[String(h.book)] ?? "")
                      : (book.sections[String(h.book)] ?? "")}
                  </span>
                  <button
                    type="button"
                    className="choice-trigger"
                    aria-label={`${t("hd.menu")} ${h.num}`}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuFor(menuOpen ? null : id)}
                  >
                    ⋯
                  </button>
                </div>
                {menuOpen && (
                  <>
                    <button
                      type="button"
                      className="choice-backdrop"
                      aria-label={t("qr.close")}
                      onClick={() => setMenuFor(null)}
                      tabIndex={-1}
                    />
                    <span
                      className="choice-menu"
                      role="menu"
                      aria-label={`${t("hd.menu")} ${h.num}`}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setMenuFor(null);
                      }}
                    >
                      <button
                        type="button"
                        role="menuitemcheckbox"
                        aria-checked={read}
                        onClick={pick(() => toggleRead(id))}
                      >
                        <span aria-hidden>{read ? "✓" : "○"}</span> {t("hd.read")}
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={pick(() => copy(h.text, `${book.ar} ${h.num}`))}
                      >
                        <span aria-hidden>📋</span> {t("hd.copy")}
                      </button>
                      <button
                        type="button"
                        role="menuitemcheckbox"
                        aria-checked={favs.includes(id)}
                        onClick={pick(() => toggleFav(id))}
                      >
                        <span aria-hidden>{favs.includes(id) ? "★" : "☆"}</span> {t("hd.favAria")}
                      </button>
                    </span>
                  </>
                )}
              </article>
            );
          })}
          <div className="pager">
            <button type="button" disabled={safePage <= 0} onClick={() => setPage(safePage - 1)}>
              ›
            </button>
            <span>
              {safePage + 1} / {pages}
            </span>
            <button
              type="button"
              disabled={safePage >= pages - 1}
              onClick={() => setPage(safePage + 1)}
            >
              ‹
            </button>
          </div>
        </>
      )}
    </div>
  );
}
