// Share-as-image: canvas-rendered milestone card (stats the user chose to
// share). Never receives reflections, mood, or history — callers pass an
// explicit ShareStats allowlist only. See docs/PRIVACY.md.
export type ShareStats = { avg: number; streak: number; witr: number; pages: number; days: number };

/** Renders a 1080x1350 milestone card and shares (or downloads) it. */
export async function shareProgress(s: ShareStats): Promise<"shared" | "downloaded" | "failed"> {
  try {
    const W = 1080;
    const H = 1350;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const g = canvas.getContext("2d");
    if (!g) return "failed";
    const grad = g.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#0d453d");
    grad.addColorStop(1, "#14725d");
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);
    g.fillStyle = "rgba(255,255,255,0.08)";
    g.beginPath();
    g.arc(W - 120, 180, 260, 0, Math.PI * 2);
    g.fill();
    g.textAlign = "center";
    g.fillStyle = "#f5ce73";
    g.font = "120px serif";
    g.fillText("و", W / 2, 300);
    g.fillStyle = "#f1f7f4";
    g.font = "bold 72px sans-serif";
    g.fillText("حصاد وِردي", W / 2, 430);
    g.font = "46px sans-serif";
    g.fillStyle = "#cde5dc";
    const rows: [string, string][] = [
      [`${s.avg}%`, "متوسط الإنجاز"],
      [`${s.streak}`, "أيام متتالية"],
      [`${s.witr}`, "ليالي الوتر"],
      [`${s.pages}`, "صفحة قرآن"],
    ];
    rows.forEach(([v, label], i) => {
      const y = 600 + i * 170;
      g.fillStyle = "#f5ce73";
      g.font = "bold 84px sans-serif";
      g.fillText(v, W / 2, y);
      g.fillStyle = "#cde5dc";
      g.font = "40px sans-serif";
      g.fillText(label, W / 2, y + 60);
    });
    g.fillStyle = "rgba(255,255,255,0.6)";
    g.font = "32px sans-serif";
    g.fillText("وِرد — رفيقك اليومي", W / 2, H - 80);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
    if (!blob) return "failed";
    const file = new File([blob], "wird-progress.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: "حصاد وِردي" });
      return "shared";
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wird-progress.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return "downloaded";
  } catch {
    return "failed";
  }
}
