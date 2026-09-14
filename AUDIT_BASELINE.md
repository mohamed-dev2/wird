# Audit Baseline — v0.1.0 (STEP 9, 2026-09-14)

Frozen reference for future audits: re-run the gates and diff against
these numbers. Any drop fails the comparison — investigate before ship.

- Commit: `26ef4ac` (+ audit commit to follow in git log).
- Version: `0.1.0`. Node (CI pin): 22. Local run: v24.19.0.
- Routes: 10 (`/`, account, calendar, insights, library, recovery,
  review, private-plans, terms, privacy) + `not-found` handler.
- Feature docs: 14. Storage keys: 58 schema (+12 meta/session = 70
  documented). Integrations: 3 hosts. Dictionary: 979 keys, parity ✓.
- Unit: 32 files / 246 tests — all pass.
- E2E: 11 files / 45 tests — all pass (prod server, serial).
- Gates: typecheck, lint (0 warnings), format, docs, comments, css,
  boundaries — all green. `npm audit`: 0 vulnerabilities.
- Build: clean, 15 static routes.
- Open findings: 0 (1 × P3 roadmapped: check-in notes display).
- Known limitations: Chromium-only CI; no prod run; no memory soak;
  scholar review pending (see `AUDIT_REPORT.md`).
