export function isVoiceSupported(): boolean {
  try {
    const w = window as unknown as Record<string, unknown>;
    return (
      typeof w.SpeechRecognition === "function" || typeof w.webkitSpeechRecognition === "function"
    );
  } catch {
    return false;
  }
}

/** One-shot Arabic dictation. Resolves with transcript or null. */
export function listenOnce(lang = "ar-SA", timeoutMs = 8000): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const w = window as unknown as Record<string, new () => VoiceRecognizer>;
      const Ctor = (w.SpeechRecognition ?? w.webkitSpeechRecognition) as
        (new () => VoiceRecognizer) | undefined;
      if (!Ctor) return resolve(null);
      const rec = new Ctor();
      rec.lang = lang;
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      let done = false;
      const finish = (v: string | null) => {
        if (done) return;
        done = true;
        try {
          rec.stop();
        } catch {}
        resolve(v);
      };
      const timer = window.setTimeout(() => finish(null), timeoutMs);
      rec.onresult = (e: { results: { transcript: string }[][] }) => {
        window.clearTimeout(timer);
        finish(e.results[0]?.[0]?.transcript?.trim() || null);
      };
      rec.onerror = () => {
        window.clearTimeout(timer);
        finish(null);
      };
      rec.onend = () => {
        window.clearTimeout(timer);
        finish(null);
      };
      rec.start();
    } catch {
      resolve(null);
    }
  });
}

type VoiceRecognizer = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: { transcript: string }[][] }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

const COMMANDS: [RegExp, string][] = [
  [/فجر/, "fajr-jamaa"],
  [/ظهر/, "dhuhr-jamaa"],
  [/عصر/, "asr-jamaa"],
  [/مغرب/, "maghrib-jamaa"],
  [/عشاء/, "isha-jamaa"],
  [/وتر/, "witr"],
  [/قيام/, "qiyam"],
  [/قرآن|ورد|صفحة/, "quran"],
  [/ضحى/, "duha"],
  [/استغفار|تسبيح|ذكر/, "tasbeeh-plus"],
  [/صيام|صائم|صوم/, "fast-log"],
];

export function matchCommand(text: string): string | null {
  const t = text.replace(/[أإآ]/g, "ا");
  for (const [re, id] of COMMANDS) if (re.test(t)) return id;
  return null;
}
