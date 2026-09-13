# Privacy feature

Privacy is enforced structurally (layer rules), not by convention. This
doc points to the enforcement surfaces; the full model is in
`docs/PRIVACY_ARCHITECTURE.md`.

- Sensitivity classifier + network manifest: `app/lib/privacy.ts`
  (`DataSensitivity`, `sensitivityOf`, `NETWORK_ACCESS`) — kept in sync
  with DOCUMENTATION.md §4/§5 and `docs/NETWORK.md`.
- Vault (sensitive records at rest): `app/lib/vault.ts`
  (AES-256-GCM 96-bit random IV, unlock/lock on demand).
- No telemetry: `app/lib/analytics.ts` transforms are pure and local;
  `next.config.ts` sets `poweredByHeader: false`.
- Consent log: `wird-export-log-v1` records every export/emergency copy,
  shown in `/account`.
- Guidance log: `wird-guide-log-v1` records what guidance was shown,
  capped/aged, and fully suppressed when analytics opt-out is on.

**Rules:** `lib/` reads storage only through schema helpers; components
never read storage during render (hydration rule); the app must keep
working with all network access stripped (offline-first).
