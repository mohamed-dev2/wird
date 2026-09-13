# app/components/

React UI layer. Follows Next.js App Router conventions; views are
thin, props-driven wrappers around `lib/` logic.

```
components/
├── views/            # route-level views (home, account, insights, library, review, …)
├── library/          # Quran reader, hadith library, full hadith
├── overlays/         # modals, prompts, companion chrome
├── calendar.tsx      # calendar + analytics layers
├── companion.tsx     # adaptive guide + coach surface
├── transfer.tsx      # backup/restore (file, QR, LAN) — export infra
├── profile-scope.tsx # export scope toggle (device vs profile)
├── login-gate.tsx    # PIN gate (profile auth boundary)
└── …
```

- Components may import `lib/*`; never the reverse.
- Hydration rule: no storage reads during render (see CONTRIBUTING.md).
- Feature walkthrough + conventions: `docs/HOW_TO_ADD_A_FEATURE.md`.
