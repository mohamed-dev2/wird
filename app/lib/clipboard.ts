/** Best-effort clipboard copy shared by share/copy buttons. */
export function copyText(text: string): void {
  try {
    void navigator.clipboard?.writeText(text);
  } catch {}
}
