"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { copyText } from "../lib/clipboard";
import {
  collectBackup,
  decryptBackup,
  encryptBackup,
  markBackup,
  previewRestore,
  restoreBackupSafe,
  unwrapDecrypted,
  wrapForEncryption,
} from "../lib/crypto";
import {
  assembleChunks,
  chunkPayload,
  decodeChunk,
  encodeChunk,
  gunzipFromB64,
  gzipToB64,
  isSaneChunk,
} from "../lib/transfer";
import { lanAnswer, lanApplyAnswer, lanOffer } from "../lib/lan";
import { getActiveProfileId } from "../lib/profiles";
import { loadVerifiers, newRecoveryPhrase, saveVerifier } from "../lib/recovery";
import { useT } from "../lib/i18n";
import { useWird } from "./wird-store";

type Tab = "qr" | "scan" | "lan" | "rec";

function randomPin(): string {
  try {
    const b = crypto.getRandomValues(new Uint8Array(3));
    return String(100000 + (((b[0] ?? 0) * 65536 + (b[1] ?? 0) * 256 + (b[2] ?? 0)) % 900000));
  } catch {
    return String(100000 + Math.floor(Math.random() * 900000));
  }
}

function QrShow() {
  const t = useT();
  const [pin, setPin] = useState(randomPin);
  const [chunks, setChunks] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (chunks.length === 0) return;
    const id = window.setInterval(() => setIdx((i) => (i + 1) % chunks.length), 600);
    return () => window.clearInterval(id);
  }, [chunks.length]);

  useEffect(() => {
    const c = canvasRef.current;
    const text = chunks[idx];
    if (!c || !text) return;
    void QRCode.toCanvas(c, text, { width: 280, margin: 1 }).catch(() => {});
  }, [chunks, idx]);

  const build = async () => {
    if (pin.trim().length < 4 || busy) return;
    setBusy(true);
    try {
      const payload = await encryptBackup(pin.trim(), wrapForEncryption(collectBackup()));
      const b64 = await gzipToB64(payload);
      setChunks(chunkPayload(b64).map(encodeChunk));
      setIdx(0);
    } catch {
      setChunks([]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="transfer-pane">
      <label className="time-label">
        {t("tr.pin")}
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 12))}
          inputMode="numeric"
        />
      </label>
      <div className="backup-actions">
        <button type="button" onClick={() => void build()} disabled={busy}>
          {t("tr.show")}
        </button>
        {chunks.length > 0 && (
          <button type="button" className="linklike" onClick={() => setChunks([])}>
            {t("tr.stop")}
          </button>
        )}
      </div>
      {chunks.length > 0 && (
        <div className="qr-stage">
          <canvas ref={canvasRef} />
          <p>
            {idx + 1} {t("tr.of")} {chunks.length}
          </p>
        </div>
      )}
    </div>
  );
}

function QrScan() {
  const t = useT();
  const [on, setOn] = useState(false);
  const [got, setGot] = useState<Map<number, string>>(new Map());
  const [total, setTotal] = useState(0);
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const gotRef = useRef(got);
  // Session lock: chunks from a different transfer (different n) are foreign
  // and must never mix into this assembly. Resets when scanning restarts.
  const sessionN = useRef(0);
  useEffect(() => {
    gotRef.current = got;
  }, [got]);

  const stopScan = () => {
    setOn(false);
    setGot(new Map());
    setTotal(0);
    sessionN.current = 0;
    setMsg("");
    setErr("");
  };

  useEffect(() => {
    if (!on) return;
    let raf = 0;
    let live = true;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const loop = () => {
      if (!live) return;
      const video = videoRef.current;
      if (video && video.readyState >= 2 && ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        try {
          ctx.drawImage(video, 0, 0);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(img.data, img.width, img.height);
          if (code?.data) {
            const c = decodeChunk(code.data);
            // Malformed, out-of-range, or oversized chunks are ignored;
            // duplicates collapse in the Map; out-of-order is fine.
            if (c && isSaneChunk(c)) {
              if (sessionN.current !== 0 && sessionN.current !== c.n) {
                // Foreign session — never mix payloads.
              } else {
                if (gotRef.current.size === 0) sessionN.current = c.n;
                setTotal(c.n);
                setGot((prev) => {
                  if (prev.get(c.i)) return prev;
                  const next = new Map(prev);
                  next.set(c.i, c.payload);
                  return next;
                });
              }
            }
          }
        } catch {}
      }
      raf = requestAnimationFrame(loop);
    };
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (!live) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => {});
        }
        raf = requestAnimationFrame(loop);
      })
      .catch(() => setErr(t("tr.needCam")));
    return () => {
      live = false;
      cancelAnimationFrame(raf);
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);

  const apply = async () => {
    setErr("");
    setMsg("");
    // Race guard: abort if the active profile changed during the async pipeline.
    const startedProfile = getActiveProfileId();
    try {
      const b64 = assembleChunks(gotRef.current, total);
      if (!b64 || pin.trim().length < 4) return;
      setMsg(t("tr.stVerify"));
      const payload = await gunzipFromB64(b64, true);
      setMsg(t("tr.stDecrypt"));
      const data = unwrapDecrypted(await decryptBackup(pin.trim(), payload));
      if (getActiveProfileId() !== startedProfile) {
        setErr(t("tr.switched"));
        setMsg("");
        return;
      }
      setMsg(t("tr.stValidate"));
      previewRestore(data);
      const report = restoreBackupSafe(data);
      markBackup("import");
      setMsg(
        report.skipped > 0
          ? t("tr.partial", { a: report.applied, q: report.skipped })
          : `${t("tr.restored")} (${report.applied})`,
      );
      // Fresh session for any next transfer — never reuse these chunks.
      setGot(new Map());
      setTotal(0);
      sessionN.current = 0;
    } catch {
      setErr(t("tr.badPin"));
      setMsg("");
    }
  };

  return (
    <div className="transfer-pane">
      <p className="chart-caption">{t("tr.pointCam")}</p>
      <div className="backup-actions">
        <button type="button" onClick={() => (on ? stopScan() : (setErr(""), setOn(true)))}>
          {on ? t("tr.stop") : t("tr.startCam")}
        </button>
        {total > 0 && (
          <span className="lib-hint">
            {t("tr.got")}: {got.size}/{total}
          </span>
        )}
      </div>
      {on && <video ref={videoRef} className="scan-video" playsInline muted />}
      {total > 0 && got.size >= total && (
        <>
          <label className="time-label">
            {t("tr.askPin")}
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 12))}
              inputMode="numeric"
            />
          </label>
          <div className="backup-actions">
            <button type="button" onClick={() => void apply()}>
              {t("tr.apply")}
            </button>
          </div>
        </>
      )}
      {msg && <p className="backup-msg">{msg}</p>}
      {err && <p className="backup-msg">{err}</p>}
    </div>
  );
}

function LanSend() {
  const t = useT();
  const [pin, setPin] = useState(randomPin);
  const [offer, setOffer] = useState("");
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("");
  const sessionRef = useRef<{
    pc: RTCPeerConnection;
    send: (t: string) => void;
    close: () => void;
  } | null>(null);
  const openRef = useRef(false);

  useEffect(() => {
    return () => {
      try {
        sessionRef.current?.close();
      } catch {}
    };
  }, []);

  const makeOffer = async () => {
    try {
      setStatus(t("tr.waiting"));
      openRef.current = false;
      const s = await lanOffer({
        onOpen: () => {
          openRef.current = true;
          setStatus(t("tr.connected"));
        },
        onClose: () => setStatus(""),
      });
      sessionRef.current = s;
      setOffer(s.code);
    } catch {
      setStatus(t("tr.badPin"));
    }
  };

  const connect = async () => {
    const s = sessionRef.current;
    if (!s || !answer.trim() || pin.trim().length < 4) return;
    try {
      await lanApplyAnswer(s.pc, answer.trim());
    } catch {
      setStatus(t("tr.badCode"));
      return;
    }
    // wait for the channel to open (receiver side)
    for (let i = 0; i < 40 && !openRef.current; i++) {
      await new Promise((r) => setTimeout(r, 500));
    }
    if (!openRef.current) {
      setStatus(t("tr.timeout"));
      return;
    }
    try {
      const payload = await encryptBackup(pin.trim(), wrapForEncryption(collectBackup()));
      const b64 = await gzipToB64(payload);
      const body = JSON.stringify({ n: 1, parts: [b64] });
      s.send(`WIRCLAN:${body}`);
      setStatus(t("tr.sent"));
    } catch {
      setStatus(t("tr.failed"));
    }
  };

  const copy = copyText;

  return (
    <div className="transfer-pane">
      <p className="chart-caption">{t("tr.wifi")}</p>
      <label className="time-label">
        {t("tr.pin")}
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 12))}
          inputMode="numeric"
        />
      </label>
      <div className="backup-actions">
        <button type="button" onClick={() => void makeOffer()}>
          {t("tr.makeOffer")}
        </button>
      </div>
      {offer && (
        <>
          <p className="chart-caption">{t("tr.offerStep")}</p>
          <textarea readOnly value={offer} rows={3} aria-label={t("tr.offer")} />
          <div className="backup-actions">
            <button type="button" onClick={() => copy(offer)}>
              {t("tr.copy")}
            </button>
          </div>
          <p className="chart-caption">{t("tr.answerStep")}</p>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={3}
            aria-label={t("tr.answer")}
            placeholder="…"
          />
          <div className="backup-actions">
            <button type="button" onClick={() => void connect()}>
              {t("tr.connect")}
            </button>
          </div>
        </>
      )}
      {status && <p className="backup-msg">{status}</p>}
      <p className="chart-caption">{t("tr.smallNote")}</p>
    </div>
  );
}

function LanReceive() {
  const t = useT();
  const [offer, setOffer] = useState("");
  const [answer, setAnswer] = useState("");
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState("");
  const [msg, setMsg] = useState("");
  const partsRef = useRef<string[]>([]);
  const sessionRef = useRef<{ close: () => void } | null>(null);

  useEffect(() => {
    return () => {
      try {
        sessionRef.current?.close();
      } catch {}
    };
  }, []);

  const makeAnswer = async () => {
    if (!offer.trim()) return;
    try {
      setStatus(t("tr.waiting"));
      const s = await lanAnswer(offer.trim(), {
        onOpen: () => setStatus(t("tr.connected")),
        onMessage: (text) => {
          try {
            // Validate before buffering: bounded parts, bounded total size.
            // A failed transfer is never partially applied (see apply()).
            const body = text.startsWith("WIRCLAN:") ? text.slice(8) : text;
            const d = JSON.parse(body) as { parts?: unknown };
            if (!Array.isArray(d.parts) || d.parts.length === 0 || d.parts.length > 8) return;
            if (!d.parts.every((p) => typeof p === "string" && p.length <= 8_000_000)) return;
            const joined = (d.parts as string[]).join("");
            if (joined.length === 0 || joined.length > 32_000_000) return;
            partsRef.current = d.parts as string[];
            setStatus(t("tr.sent"));
          } catch {}
        },
        onClose: () => {},
      });
      sessionRef.current = s;
      setAnswer(s.code);
    } catch {
      setStatus(t("tr.badCode"));
    }
  };

  const apply = async () => {
    const startedProfile = getActiveProfileId();
    try {
      const b64 = partsRef.current.join("");
      if (!b64) {
        setStatus(t("tr.noData"));
        return;
      }
      if (pin.trim().length < 4) return;
      setStatus(t("tr.stVerify"));
      const payload = await gunzipFromB64(b64, true);
      setStatus(t("tr.stDecrypt"));
      const data = unwrapDecrypted(await decryptBackup(pin.trim(), payload));
      if (getActiveProfileId() !== startedProfile) {
        setStatus(t("tr.switched"));
        return;
      }
      setStatus(t("tr.stValidate"));
      previewRestore(data);
      const report = restoreBackupSafe(data);
      markBackup("import");
      partsRef.current = [];
      setStatus("");
      setMsg(
        report.skipped > 0
          ? t("tr.partial", { a: report.applied, q: report.skipped })
          : `${t("tr.restored")} (${report.applied})`,
      );
    } catch {
      setStatus(t("tr.badPin"));
    }
  };

  const copy = copyText;

  return (
    <div className="transfer-pane">
      <p className="chart-caption">{t("tr.wifi")}</p>
      <p className="chart-caption">{t("tr.pasteOffer")}</p>
      <textarea
        value={offer}
        onChange={(e) => setOffer(e.target.value)}
        rows={3}
        aria-label={t("tr.offer")}
      />
      <div className="backup-actions">
        <button type="button" onClick={() => void makeAnswer()}>
          {t("tr.makeAnswer")}
        </button>
      </div>
      {answer && (
        <>
          <textarea readOnly value={answer} rows={3} aria-label={t("tr.answer")} />
          <div className="backup-actions">
            <button type="button" onClick={() => copy(answer)}>
              {t("tr.copy")}
            </button>
          </div>
          <label className="time-label">
            {t("tr.askPin")}
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 12))}
              inputMode="numeric"
            />
          </label>
          <div className="backup-actions">
            <button type="button" onClick={() => void apply()}>
              {t("tr.apply")}
            </button>
          </div>
        </>
      )}
      {status && <p className="backup-msg">{status}</p>}
      {msg && <p className="backup-msg">{msg}</p>}
    </div>
  );
}

function Recovery() {
  const t = useT();
  const { activeProfile } = useWird();
  const [words, setWords] = useState<string[] | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [has, setHas] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-once hydration of verifier flag
    if (activeProfile) setHas(Boolean(loadVerifiers()[activeProfile.id]));
  }, [activeProfile]);

  const generate = async () => {
    try {
      const { words: w, verifier } = await newRecoveryPhrase();
      if (activeProfile) {
        saveVerifier(activeProfile.id, verifier);
        setHas(true);
      }
      setWords(w);
      setConfirmed(false);
    } catch {}
  };

  return (
    <div className="transfer-pane">
      <p className="chart-caption">{t("rc.sub")}</p>
      {has && <p className="backup-msg">{t("rc.has")}</p>}
      <div className="backup-actions">
        <button type="button" onClick={() => void generate()}>
          {t("rc.gen")}
        </button>
      </div>
      {words && (
        <>
          <div className="words-grid" dir="ltr">
            {words.map((w, i) => (
              <span key={i}>
                <b>{i + 1}</b> {w}
              </span>
            ))}
          </div>
          <p className="chart-caption">{t("rc.warn")}</p>
          <label className="time-label">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            {t("rc.confirm")}
          </label>
          {confirmed && (
            <div className="backup-actions">
              <button type="button" onClick={() => setWords(null)}>
                {t("rc.saved")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function Transfer() {
  const t = useT();
  const [tab, setTab] = useState<Tab>("qr");
  return (
    <article className="new-day">
      <span>📲</span>
      <div>
        <b>{t("tr.title")}</b>
        <p>{t("tr.sub")}</p>
        <div className="book-chips">
          {(
            [
              ["qr", t("tr.tabQr")],
              ["scan", t("tr.tabScan")],
              ["lan", t("tr.tabLan")],
              ["rec", t("tr.tabRec")],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
              className={tab === id ? "selected" : ""}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === "qr" && <QrShow />}
        {tab === "scan" && <QrScan />}
        {tab === "lan" && (
          <>
            <LanSend />
            <hr className="soft-hr" />
            <LanReceive />
          </>
        )}
        {tab === "rec" && <Recovery />}
      </div>
    </article>
  );
}
