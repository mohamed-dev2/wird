"use client";

import { useState } from "react";
import { useT } from "../lib/i18n";
import { AVATARS, loadProfiles, saveProfiles, sha256Hex } from "../lib/profiles";
import { loadVerifiers, recoveryVerifier, verifyPhrase } from "../lib/recovery";
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
  const [lockLeft, setLockLeft] = useState(0);
  const [forgot, setForgot] = useState(false);
  const [words, setWords] = useState("");
  const [newPin, setNewPin] = useState("");

  const doResetPin = async () => {
    if (!activeProfile) return;
    setErr("");
    setBusy(true);
    try {
      const entropy = await verifyPhrase(words);
      if (!entropy) {
        setErr(t("rc.badWords"));
        return;
      }
      const verifier = await recoveryVerifier(words.trim().split(/\s+/));
      const saved = loadVerifiers()[activeProfile.id];
      if (!saved || saved !== verifier) {
        setErr(t("rc.badWords"));
        return;
      }
      const pinV = newPin.replace(/\D/g, "");
      if (pinV.length < 4) {
        setErr(t("auth.pin"));
        return;
      }
      const pinHash = await sha256Hex(pinV);
      const list = loadProfiles().map((p) => (p.id === activeProfile.id ? { ...p, pinHash } : p));
      saveProfiles(list);
      try {
        localStorage.removeItem(`wird-pinlock-${activeProfile.id}`);
      } catch {}
      setForgot(false);
      setWords("");
      setNewPin("");
      setErr(t("rc.done"));
    } finally {
      setBusy(false);
    }
  };

  const pinLockKey = activeProfile ? `wird-pinlock-${activeProfile.id}` : "wird-pinlock";
  const checkLock = (): number => {
    try {
      const raw = localStorage.getItem(pinLockKey);
      if (!raw) return 0;
      const v = JSON.parse(raw) as { count?: number; until?: number };
      if (v.until && v.until > Date.now()) return Math.ceil((v.until - Date.now()) / 1000);
      return 0;
    } catch {
      return 0;
    }
  };
  const noteFail = () => {
    try {
      const raw = localStorage.getItem(pinLockKey);
      const v = raw ? (JSON.parse(raw) as { count?: number; until?: number }) : {};
      const count = (v.count ?? 0) + 1;
      if (count >= 5) {
        localStorage.setItem(pinLockKey, JSON.stringify({ count: 0, until: Date.now() + 30000 }));
        setLockLeft(30);
      } else {
        localStorage.setItem(pinLockKey, JSON.stringify({ count, until: 0 }));
      }
    } catch {}
  };
  const tryUnlock = (v: string) => {
    const left = checkLock();
    if (left > 0) {
      setLockLeft(left);
      setErr(t("auth.locked"));
      return;
    }
    setBusy(true);
    void unlockProfile(v)
      .then((ok) => {
        if (!ok) {
          noteFail();
          setErr(t("auth.wrongPin"));
        }
      })
      .finally(() => setBusy(false));
  };

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
                  tryUnlock(v);
                }
              }}
            />
            {err && <p className="backup-msg">{err}</p>}
            {lockLeft > 0 && (
              <p className="backup-msg">
                {t("auth.locked")} ({lockLeft})
              </p>
            )}
            <button
              type="button"
              className="review-submit"
              disabled={busy}
              onClick={() => {
                const v = pinTry;
                setPinTry("");
                tryUnlock(v);
              }}
            >
              {t("auth.unlock")}
            </button>
            <button type="button" className="linklike" onClick={() => switchProfile("")}>
              {t("auth.switch")}
            </button>
            <button
              type="button"
              className="linklike"
              onClick={() => {
                setForgot((f) => !f);
                setErr("");
              }}
            >
              {t("rc.forgot")}
            </button>
            {forgot && (
              <>
                <textarea
                  value={words}
                  onChange={(e) => setWords(e.target.value)}
                  placeholder={t("rc.enterWords")}
                  aria-label={t("rc.enterWords")}
                  rows={3}
                />
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={8}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                  placeholder={t("rc.newPin")}
                  aria-label={t("rc.newPin")}
                />
                <button
                  type="button"
                  className="review-submit"
                  disabled={busy}
                  onClick={() => void doResetPin()}
                >
                  {t("rc.reset")}
                </button>
              </>
            )}
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
