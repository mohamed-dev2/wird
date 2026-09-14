// Deen library view (STEP 10): the browsable side of the journey —
// mustahabb/deed shelves, awareness lists, speech, character, learning
// cards, and achievements. Read-only over the catalog (state mutations
// for trackable items live in deen-today); source/reference/school
// notes render wherever a verified kind appears.
"use client";

import { useT } from "../../lib/i18n";
import {
  AWARENESS,
  CHARACTER,
  DEEDS,
  HARAM,
  LEARN,
  SPEECH,
  type AwarenessItem,
} from "../../lib/deen-catalog";
import { ACHIEVEMENT_IDS } from "../../lib/deen-catalog";
import { loadDeen } from "../../lib/deen";
import { useEffect, useState } from "react";

function KindLine({ item, t }: { item: AwarenessItem; t: (k: string) => string }) {
  return (
    <p className="deen-src">
      <em className={`deen-kind ${item.kind}`}>{t(`dn.kind.${item.kind}`)}</em>
      {item.kind === "verified" && item.source && (
        <span>
          {" · "}
          {t("dn.source")}: {item.source}
          {item.reference && (
            <>
              {" · "}
              {t("dn.ref")}: {item.reference}
            </>
          )}
          {item.schoolsKey && <> · {t(item.schoolsKey)}</>}
        </span>
      )}
    </p>
  );
}

export function DeenLibraryView() {
  const t = useT();
  const [earned, setEarned] = useState<Record<string, string>>({});
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-once hydration of earned achievements
      setEarned(loadDeen().achievements as Record<string, string>);
    } catch {}
  }, []);

  const mustahabb = DEEDS.filter((d) => d.shelf === "mustahabb");
  const deeds = DEEDS.filter((d) => d.shelf === "deeds");

  return (
    <section className="destination-view" aria-label={t("dn.library")}>
      <div className="view-hero">
        <p className="eyebrow">{t("dn.learn")}</p>
        <h2>{t("dn.library")}</h2>
        <p>{t("dn.learnSub")}</p>
      </div>

      <section className="deen-section" aria-label={t("dn.mustahabb")}>
        <div className="section-heading">
          <div>
            <h2>{t("dn.mustahabb")}</h2>
            <p>{t("dn.mustahabbSub")}</p>
          </div>
        </div>
        <div className="deen-list">
          {mustahabb.map((d) => (
            <div key={d.id} className="deen-row static">
              <span className="deen-text">
                <b>{t(d.nameKey)}</b>
                <small>{t(d.descKey)}</small>
              </span>
              <KindLine item={d} t={t} />
            </div>
          ))}
        </div>
      </section>

      <section className="deen-section" aria-label={t("dn.deeds")}>
        <div className="section-heading">
          <div>
            <h2>{t("dn.deeds")}</h2>
            <p>{t("dn.deedsSub")}</p>
          </div>
        </div>
        <div className="deen-list">
          {deeds.map((d) => (
            <div key={d.id} className="deen-row static">
              <span className="deen-text">
                <b>{t(d.nameKey)}</b>
                <small>{t(d.descKey)}</small>
              </span>
              <KindLine item={d} t={t} />
            </div>
          ))}
        </div>
      </section>

      <section className="deen-section" aria-label={t("dn.awareness")}>
        <div className="section-heading">
          <div>
            <h2>{t("dn.awareness")}</h2>
            <p>{t("dn.awarenessSub")}</p>
          </div>
        </div>
        <div className="deen-list">
          {AWARENESS.map((a) => (
            <div key={a.id} className="deen-row static">
              <span className="deen-text">
                <b>{t(a.nameKey)}</b>
                <small>{t(a.descKey)}</small>
              </span>
              <KindLine item={a} t={t} />
            </div>
          ))}
        </div>
      </section>

      <section className="deen-section" aria-label={t("dn.haramA")}>
        <div className="section-heading">
          <div>
            <h2>{t("dn.haramA")}</h2>
            <p>{t("dn.haramSub")}</p>
          </div>
        </div>
        <p className="deen-note">{t("dn.noScore")}</p>
        <div className="deen-list">
          {HARAM.map((h) => (
            <div key={h.id} className="deen-row static">
              <span className="deen-text">
                <b>{t(h.nameKey)}</b>
                <small>{t(h.descKey)}</small>
              </span>
              <KindLine item={h} t={t} />
            </div>
          ))}
        </div>
      </section>

      <section className="deen-section" aria-label={t("dn.speechT")}>
        <div className="section-heading">
          <div>
            <h2>{t("dn.speechT")}</h2>
            <p>{t("dn.speechSub")}</p>
          </div>
        </div>
        <div className="deen-list">
          {SPEECH.map((item) => (
            <div key={item.id} className="deen-row static">
              <span className="deen-text">
                <b>{t(item.nameKey)}</b>
                <small>{t(item.descKey)}</small>
              </span>
              <KindLine item={item} t={t} />
            </div>
          ))}
        </div>
      </section>

      <section className="deen-section" aria-label={t("dn.charT")}>
        <div className="section-heading">
          <div>
            <h2>{t("dn.character")}</h2>
            <p>{t("dn.characterSub")}</p>
          </div>
        </div>
        <div className="deen-list">
          {CHARACTER.map((c) => (
            <div key={c.id} className="deen-row static">
              <span className="deen-text">
                <b>{t(c.nameKey)}</b>
                <small>{t(c.descKey)}</small>
              </span>
              <KindLine item={c} t={t} />
            </div>
          ))}
        </div>
      </section>

      <section className="deen-section" aria-label={t("dn.learn")}>
        <div className="section-heading">
          <div>
            <h2>{t("dn.learn")}</h2>
            <p>{t("dn.learnSub")}</p>
          </div>
        </div>
        <div className="deen-list">
          {LEARN.map((c) => (
            <div key={c.id} className="deen-row static">
              <span className="deen-text">
                <b>{t(c.titleKey)}</b>
                <small>{t(c.bodyKey)}</small>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="deen-section" aria-label={t("dn.achievements")}>
        <div className="section-heading">
          <div>
            <h2>{t("dn.achievements")}</h2>
            <p>{t("dn.achSub")}</p>
          </div>
        </div>
        <div className="deen-list">
          {ACHIEVEMENT_IDS.map((id) => {
            const key = `dn.ach.${id === "first-step" ? "firstStep" : id}`;
            const when = earned[id];
            return (
              <div key={id} className={`deen-row static ${when ? "on" : ""}`}>
                <span className="deen-text">
                  <b>{t(key)}</b>
                  <small>{t(`${key}D`)}</small>
                </span>
                <span>{when ? `${t("dn.done")} · ${when}` : "○"}</span>
              </div>
            );
          })}
        </div>
      </section>
    </section>
  );
}
