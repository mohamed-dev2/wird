"use client";

import { useMemo, useState } from "react";
import { HADITH_BOOKS, NAWAWI, type HadithEntry } from "../../lib/data/hadith";
import { normalizeAr } from "../../lib/quran";
import { useStoredState } from "../../lib/use-stored-state";
import { useT } from "../../lib/i18n";

function EntryCard({ entry, fav, onFav }: { entry: HadithEntry; fav: boolean; onFav: () => void }) {
  const t = useT();
  return (
    <article className="hadith-card">
      <p>{entry.text}</p>
      <div className="hadith-meta">
        <span>{entry.grade}</span>
        <span>{entry.ref}</span>
        <button type="button" onClick={onFav} aria-pressed={fav} aria-label={t("hd.favAria")}>
          {fav ? "★" : "☆"}
        </button>
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
              <EntryCard entry={e} fav={favs.includes(e.id)} onFav={() => toggleFav(e.id)} />
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
                    <EntryCard entry={e} fav onFav={() => toggleFav(e.id)} />
                  </div>
                ))}
            </>
          )}
          {HADITH_BOOKS.filter((b) => b.id === book).map((b) => (
            <div key={b.id}>
              <p className="chart-caption">
                {b.full} - {b.note}. {t("hd.curated")}
              </p>
              {b.entries.map((e) => (
                <EntryCard
                  key={e.id}
                  entry={e}
                  fav={favs.includes(e.id)}
                  onFav={() => toggleFav(e.id)}
                />
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
