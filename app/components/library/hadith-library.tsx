"use client";

import { useMemo, useState } from "react";
import { HADITH_BOOKS, NAWAWI, type HadithEntry } from "../../lib/data/hadith";
import { normalizeAr } from "../../lib/quran";
import { useStoredState } from "../../lib/use-stored-state";
import { useT } from "../../lib/i18n";

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
  const copy = () => {
    try {
      void navigator.clipboard?.writeText(`${entry.text} — (${entry.ref})`);
    } catch {}
  };
  return (
    <article className={`hadith-card${read ? " read" : ""}`}>
      <p>{entry.text}</p>
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

  const all: (HadithEntry & { book: string })[] = useMemo(
    () => [
      ...NAWAWI.map((e) => ({ ...e, book: "الأربعون النووية" })),
      ...HADITH_BOOKS.flatMap((b) => b.entries.map((e) => ({ ...e, book: b.name }))),
    ],
    [],
  );

  const results = useMemo(() => {
    const q = normalizeAr(query);
    if (q.length < 2) return null;
    return all.filter((e) => normalizeAr(e.text).includes(q)).slice(0, 30);
  }, [all, query]);

  return (
    <div className="hadith-lib">
      <div className="lib-toolbar">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("hd.search")}
          aria-label={t("hd.searchAria")}
        />
      </div>
      {results ? (
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
