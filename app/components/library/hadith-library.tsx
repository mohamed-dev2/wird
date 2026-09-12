// Curated hadith selections browser (famous selections + Nawawi 40).
// Texts come verbatim from lib/data/hadith.ts with grade + ref; nothing
// here paraphrases or generates religious content.
"use client";

import { useMemo, useState } from "react";
import { HADITH_BOOKS, NAWAWI, type HadithEntry } from "../../lib/data/hadith";
import { normalizeAr } from "../../lib/quran";
import { copyText } from "../../lib/clipboard";
import { useStoredState } from "../../lib/use-stored-state";
import { useT } from "../../lib/i18n";
import { HadithFull } from "./hadith-full";
import type { FullBookId } from "../../lib/hadith-full";

function gradeClass(grade: string): string {
  if (grade.includes("متفق")) return "grade-muttafaq";
  if (grade.startsWith("صحيح")) return "grade-sahih";
  if (grade.startsWith("حسن")) return "grade-hasan";
  return "grade-other";
}

function EntryCard({
  entry,
  fav,
  onFav,
  read,
  onRead,
}: {
  entry: HadithEntry;
  fav: boolean;
  onFav: () => void;
  read: boolean;
  onRead: () => void;
}) {
  const t = useT();
  const copy = () => copyText(`${entry.text} — (${entry.ref})`);
  return (
    <article className={`hadith-card${read ? " read" : ""}`}>
      <p>{entry.text}</p>
      <p className="hadith-en" dir="ltr">
        {entry.en}
      </p>
      {entry.meaning && (
        <details className="hadith-sharh">
          <summary>{t("hd.sharh")}</summary>
          <p>{entry.meaning}</p>
          {entry.meaningEn && (
            <p className="hadith-en" dir="ltr">
              {entry.meaningEn}
            </p>
          )}
        </details>
      )}
      <div className="hadith-meta">
        <span className={gradeClass(entry.grade)}>{entry.grade}</span>
        <span>{entry.ref}</span>
        <span className="hadith-tools">
          <button type="button" onClick={onRead} aria-pressed={read} aria-label={t("hd.read")}>
            {read ? "✓" : "○"}
          </button>
          <button type="button" onClick={copy} aria-label={t("hd.copy")}>
            📋
          </button>
          <button type="button" onClick={onFav} aria-pressed={fav} aria-label={t("hd.favAria")}>
            {fav ? "★" : "☆"}
          </button>
        </span>
      </div>
    </article>
  );
}

export function HadithLibrary() {
  const t = useT();
  const [book, setBook] = useState<string>("nawawi");
  const [query, setQuery] = useState("");
  const [favs, setFavs] = useStoredState<string[]>("wird-hadith-fav-v1", []);
  const toggleFav = (id: string) =>
    setFavs((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const [readIds, setReadIds] = useStoredState<string[]>("wird-hadith-read-v1", []);
  const toggleRead = (id: string) =>
    setReadIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const [mode, setMode] = useState<"curated" | "full">("curated");
  const [fullBook, setFullBook] = useState<FullBookId>("bukhari");

  const FULL_OF: Record<string, typeof fullBook | null> = {
    bukhari: "bukhari",
    muslim: "muslim",
    abudawud: "abudawud",
    tirmidhi: "tirmidhi",
    nasai: "nasai",
    ibnmajah: "ibnmajah",
    muwatta: "malik",
    musnad: null,
    darimi: null,
    nawawi: "nawawi",
    qudsi: "qudsi",
    dehlawi: "dehlawi",
  };

  const openFull = (curatedId: string) => {
    const target = FULL_OF[curatedId];
    if (target) setFullBook(target);
    setMode("full");
  };

  const all: (HadithEntry & { book: string })[] = useMemo(
    () => [
      ...NAWAWI.map((e) => ({ ...e, book: "الأربعون النووية" })),
      ...HADITH_BOOKS.flatMap((b) => b.entries.map((e) => ({ ...e, book: b.name }))),
    ],
    [],
  );

  const results = useMemo(() => {
    const q = normalizeAr(query);
    const qEn = query.trim().toLowerCase();
    if (q.length < 2 && qEn.length < 2) return null;
    return all
      .filter((e) => normalizeAr(e.text).includes(q) || e.en.toLowerCase().includes(qEn))
      .slice(0, 30);
  }, [all, query]);

  return (
    <div className="hadith-lib">
      <div className="book-chips">
        <button
          type="button"
          onClick={() => setMode("curated")}
          aria-pressed={mode === "curated"}
          className={mode === "curated" ? "selected" : ""}
        >
          {t("hf.curated")}
        </button>
        <button
          type="button"
          onClick={() => setMode("full")}
          aria-pressed={mode === "full"}
          className={mode === "full" ? "selected" : ""}
        >
          {t("hf.full")}
        </button>
      </div>
      {mode === "full" ? (
        <HadithFull
          favs={favs}
          toggleFav={toggleFav}
          readIds={readIds}
          toggleRead={toggleRead}
          bookId={fullBook}
          onBookId={setFullBook}
        />
      ) : (
        <>
          <div className="full-promo">
            <span>📚</span>
            <p>{t("hf.promo")}</p>
            <button type="button" onClick={() => setMode("full")}>
              {t("hf.open")}
            </button>
          </div>
          <div className="lib-toolbar">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("hd.search")}
              aria-label={t("hd.searchAria")}
            />
          </div>
        </>
      )}
      {mode === "curated" && results ? (
        <div className="lib-results">
          {results.length === 0 && <p className="chart-caption">{t("hd.noRes")}</p>}
          {results.map((e) => (
            <div key={e.id}>
              <p className="eyebrow">{e.book}</p>
              <EntryCard
                entry={e}
                fav={favs.includes(e.id)}
                onFav={() => toggleFav(e.id)}
                read={readIds.includes(e.id)}
                onRead={() => toggleRead(e.id)}
              />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="book-chips">
            <button
              type="button"
              onClick={() => setBook("nawawi")}
              aria-pressed={book === "nawawi"}
              className={book === "nawawi" ? "selected" : ""}
            >
              {t("hd.nawawi")}
            </button>
            <button
              type="button"
              onClick={() => setBook("fav")}
              aria-pressed={book === "fav"}
              className={book === "fav" ? "selected" : ""}
            >
              ★ المفضلة ({favs.length})
            </button>
            {HADITH_BOOKS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBook(b.id)}
                aria-pressed={book === b.id}
                className={book === b.id ? "selected" : ""}
              >
                {b.name}
              </button>
            ))}
          </div>
          {book === "nawawi" && (
            <>
              <p className="chart-caption">{t("hd.nawawiNote")}</p>
              <button type="button" className="goal-add" onClick={() => openFull("nawawi")}>
                {t("hf.browseAll40")}
              </button>
              {NAWAWI.map((e) => (
                <EntryCard
                  key={e.id}
                  entry={e}
                  fav={favs.includes(e.id)}
                  onFav={() => toggleFav(e.id)}
                  read={readIds.includes(e.id)}
                  onRead={() => toggleRead(e.id)}
                />
              ))}
            </>
          )}
          {book === "fav" && (
            <>
              {favs.length === 0 && <p className="chart-caption">{t("hd.favEmpty")}</p>}
              {all
                .filter((e) => favs.includes(e.id))
                .map((e) => (
                  <div key={e.id}>
                    <p className="eyebrow">{e.book}</p>
                    <EntryCard
                      entry={e}
                      fav
                      onFav={() => toggleFav(e.id)}
                      read={readIds.includes(e.id)}
                      onRead={() => toggleRead(e.id)}
                    />
                  </div>
                ))}
            </>
          )}
          {HADITH_BOOKS.filter((b) => b.id === book).map((b) => (
            <div key={b.id}>
              <div className="book-head">
                <div>
                  <b>{b.name}</b>
                  <p className="chart-caption">
                    {b.full} - {b.note}. {t("hd.curated")}
                  </p>
                </div>
                <span className="book-progress">
                  {b.entries.filter((e) => readIds.includes(e.id)).length}/{b.entries.length}
                </span>
              </div>
              {FULL_OF[b.id] && (
                <button type="button" className="goal-add" onClick={() => openFull(b.id)}>
                  {t("hf.browseFull")}
                </button>
              )}
              {b.entries.map((e) => (
                <EntryCard
                  key={e.id}
                  entry={e}
                  fav={favs.includes(e.id)}
                  onFav={() => toggleFav(e.id)}
                  read={readIds.includes(e.id)}
                  onRead={() => toggleRead(e.id)}
                />
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
