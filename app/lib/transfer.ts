export async function gzipToB64(text: string): Promise<string> {
  try {
    const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
    const buf = await new Response(stream).arrayBuffer();
    const bytes = new Uint8Array(buf);
    let s = "";
    const CHUNK = 8192;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      s += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    return btoa(s);
  } catch {
    return btoa(
      unescape(
        encodeURIComponent(text)
          .split("")
          .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
          .join(""),
      ),
    );
  }
}

export async function gunzipFromB64(b64: string, gzipped: boolean): Promise<string> {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  if (!gzipped) {
    return decodeURIComponent(
      [...bytes].map((b) => `%${b.toString(16).padStart(2, "0")}`).join(""),
    );
  }
  const stream = new Blob([bytes.buffer as ArrayBuffer])
    .stream()
    .pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).text();
}

export type QrChunk = { i: number; n: number; payload: string };

export function chunkPayload(b64: string, size = 1800): QrChunk[] {
  const parts: QrChunk[] = [];
  const n = Math.max(1, Math.ceil(b64.length / size));
  for (let i = 0; i < n; i++) {
    parts.push({ i: i + 1, n, payload: b64.slice(i * size, (i + 1) * size) });
  }
  return parts;
}

const QR_RE = /^WIRD1:(\d+)\/(\d+):([A-Za-z0-9+/=]+)$/;

export function encodeChunk(c: QrChunk): string {
  return `WIRD1:${c.i}/${c.n}:${c.payload}`;
}

export function decodeChunk(text: string): QrChunk | null {
  const m = QR_RE.exec(text.trim());
  if (!m) return null;
  return { i: Number(m[1]), n: Number(m[2]), payload: m[3] ?? "" };
}

export function assembleChunks(got: Map<number, string>, total: number): string | null {
  if (got.size !== total) return null;
  let out = "";
  for (let i = 1; i <= total; i++) {
    const p = got.get(i);
    if (p == null) return null;
    out += p;
  }
  return out;
}
