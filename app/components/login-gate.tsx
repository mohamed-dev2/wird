"use client";

import { useState } from "react";
import { useT } from "../lib/i18n";
import { AVATARS } from "../lib/profiles";
import { useWird } from "./wird-store";

export function LoginGate() {
  const t = useT();
  const {
    profiles,
    activeProfile,
    authReady,
    unlocked,
    createProfile,
    switchProfile,
    deleteProfile,
    unlockProfile,
  } = useWird();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0] ?? "🌙");
  const [pin, setPin] = useState("");
  const [pinTry, setPinTry] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  if (!authReady) {
    return (
      <main>
        <section className="content login-wrap">
          <p className="chart-caption">…</p>
        </section>
      </main>
    );
  }

  if (activeProfile && activeProfile.pinHash && !unlocked) {
    return (
      <main>
        <section className="content login-wrap">
          <div className="login-card">
            <span className="login-avatar">{activeProfile.avatar}</span>
            <h2>
              {t("auth.welcomeBack")}، {activeProfile.name}
            </h2>
            <p>{t("auth.pinHint")}</p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={pinTry}
              onChange={(e) => setPinTry(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              aria-label={t("auth.pin")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const v = pinTry;
                  setPinTry("");
                  void unlockProfile(v).then((ok) => {
                    if (!ok) setErr(t("auth.wrongPin"));
                  });
                }
              }}
            />
            {err && <p className="backup-msg">{err}</p>}
            <button
              type="button"
              className="review-submit"
              disabled={busy}
              onClick={() => {
                const v = pinTry;
                setPinTry("");
                setBusy(true);
                void unlockProfile(v)
                  .then((ok) => {
                    if (!ok) setErr(t("auth.wrongPin"));
                  })
                  .finally(() => setBusy(false));
              }}
            >
              {t("auth.unlock")}
            </button>
            <button type="button" className="linklike" onClick={() => switchProfile("")}>
              {t("auth.switch")}
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (!activeProfile) {
    const submit = () => {
      const n = name.trim();
      if (!n || busy) return;
      setBusy(true);
      void createProfile(n, avatar, pin.trim() ? pin.trim() : null).finally(() => setBusy(false));
    };
    return (
      <main>
        <section className="content login-wrap">
          <div className="login-card">
            <span className="login-avatar">و</span>
            <h2>{profiles.length === 0 ? t("auth.firstTitle") : t("auth.whoTitle")}</h2>
            <p>{t("auth.sub")}</p>
            {profiles.length > 0 && (
              <div className="profile-pick">
                {profiles.map((p) => (
                  <div key={p.id} className="profile-row">
                    <button type="button" onClick={() => switchProfile(p.id)}>
                      <span>{p.avatar}</span> {p.name} {p.pinHash ? "🔒" : ""}
                    </button>
                    <button
                      type="button"
                      className="linklike"
                      aria-label={t("auth.delete")}
                      onClick={() => {
                        try {
                          if (window.confirm(t("auth.deleteAsk"))) deleteProfile(p.id);
                        } catch {}
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("auth.namePh")}
              aria-label={t("auth.namePh")}
              maxLength={30}
            />
            <div className="avatar-pick">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvatar(a)}
                  aria-pressed={avatar === a}
                  className={avatar === a ? "selected" : ""}
                >
                  {a}
                </button>
              ))}
            </div>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder={t("auth.pinPh")}
              aria-label={t("auth.pin")}
              inputMode="numeric"
              maxLength={8}
            />
            <button type="button" className="review-submit" disabled={busy} onClick={submit}>
              {profiles.length === 0 ? t("auth.start") : t("auth.add")}
            </button>
          </div>
        </section>
      </main>
    );
  }

  return null;
}
