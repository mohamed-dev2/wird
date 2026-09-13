# Quran reader

The Quran reader loads the Uthmani mushaf, English translation, and optional
tafsir on demand, then lets the user browse, search, and play audio.

- Core modules: `app/lib/quran.ts`, `app/lib/tafsir.ts`, `app/lib/audio.ts`.
- UI: `app/components/library/quran-reader.tsx`.
- Corpus files: `public/data/quran-uthmani.min.json`, `public/data/en-clear.min.json`,
  `public/data/ar-jalalayn.min.json` (all **generated** — see `public/data/README.md`).
- Network boundaries: tafsir CDN (`api.quran.com`), audio (`everyayah.com`)
  — see `docs/NETWORK.md` and `lib/privacy.ts`.

**Key behaviors:**

- The mushaf and English translation are fetched from same-origin
  `/data/*` on mount (cached by service worker for offline use).
- Tafsir beyond Jalalayn is fetched on demand when the user taps a verse;
  the module caches the result for the session.
- Audio URLs are constructed per-reciter; playback is user-initiated and
  the media stream is torn down on pause/leave.

**Religious-content rules:** the Quran corpus is a fixed, reviewed build
artifact; changes require the review process in
`docs/HOW_TO_ADD_RELIGIOUS_CONTENT.md`.
