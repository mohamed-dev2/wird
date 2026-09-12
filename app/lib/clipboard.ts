// Best-effort clipboard copy shared by share/copy buttons.
// Falls back silently where the Clipboard API is unavailable (never throws
// into UI event handlers). Sensitive payloads (transfer codes) pass a ttlMs:
// the clipboard is overwritten with "" afterwards so secrets don't linger.
export function copyText(text: string, ttlMs?: number): void {
  try {
    void navigator.clipboard?.writeText(text);
  } catch {}
  if (ttlMs && ttlMs > 0) {
    try {
      window.setTimeout(() => {
        try {
          void navigator.clipboard?.writeText("");
        } catch {}
      }, ttlMs);
    } catch {}
  }
}
