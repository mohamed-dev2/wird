# Error handling

Every subsystem must degrade gracefully rather than crash. The user
experience on a single bad record or unavailable API is "this one thing
didn't load" — never a broken app.

## Principles

1. **Quarantine, never delete.** Corrupt records go to
   `wird-quarantine-v1` (30-day TTL). The user sees "n items quarantined"
   on `/recovery`. Missing keys get a defined fallback from the schema.
2. **Defensive read.** Every `readFromStorage` / `loadFromStorage` is
   wrapped in a `try/catch`; on parse failure the fallback is returned.
   `useStoredState` likewise, using the hydration-stable fallback on
   server-render so SSR matches client HTML.
3. **Return neutral on bad shapes.** Analytics/coach functions return
   neutral/null states rather than throwing; UI checks and renders an
   honest "not enough data" rather than fabricating results.
4. **Future-version preservation.** A record with a schema version higher
   than what the code knows is quarantined **with the original bytes**
   intact (zero-loss), not silently dropped.
5. **Never log user content.** Errors are suppressed (`catch {}` where
   logging is not useful) or contain non-PII technical markers. `console.*`
   in `app/` is forbidden by lint/CONTRIBUTING rules.

## Per-subsystem failure modes

### Storage

- **Quota exceeded (`QuotaExceededError`):** `restoreBackupSafe` rolls
  back to the pre-restore snapshot atomically; other writes (e.g.
  `saveToStorage`) throw and the UI surfaces a message rather than
  partially saving.
- **Unsafe Storage (iframe/CSP):** the `browserStorage()` helper
  (`lib/schema.ts`) falls back through `window.localStorage` → `null`
  (in-memory fallback). The app never crashes, but data won't persist
  across tabs/reloads in that mode.
- **Browser storage cleared externally:** the app continues with fallback
  values; `/recovery` shows empty health.

### Backup / restore

- **Unknown shape:** throws early with a non-technical error ("bad backup
  data") for the UI to render safely.
- **No valid keys in the payload:** throws instead of writing zero
  records (guards against overwriting storage with an empty import).
- **Partial corruption:** `restoreBackupSafe` applies valid entries,
  quarantines corrupt ones, reports both counts; nothing is lost.
- **Profile mismatch during async decrypt:** the race-guard (startedProfile
  check) aborts instead of committing to the wrong profile.

### Content loading

- **Corpus JSON fetch failure (offline/CORS):** returns the module-level
  cache fallback or an empty array; the user sees "no data" state rather
  than a blank screen. The offline-first contract: if the SW served the
  JSON bundle before, it stays available offline.
- **CDN tafsir/hadith unavailable:** the UI falls back to local/in-bundle
  content or shows a "download failed" state without crashing.
- **Missing translation key:** the literal key name is returned (`useT`
  never throws). The `docs:check` parity gate ensures this doesn't happen
  in shipped code.

### Analytics / companion

- **Short or empty history:** all analytics functions return a neutral
  shape (e.g. `null` trend, empty heatmap) that the UI interprets
  honestly. The companion starts at the "beginning" state, never in the
  middle of a journey the user didn't earn.
- **Invalid day record / malformed range:** the function returns a
  fallback (empty windows, zero counts) and the UI shows "not enough
  data" instead of invented numbers.

### Recovery / vault

- **Wrong PIN on login gate:** `setPinGateErr` displays "wrong PIN" and
  the gate remains. No information about which field failed is exposed
  beyond the aggregate "wrong."
- **Wrong vault passphrase:** caught, a vault-specific error string
  surfaced ("bad passphrase"); the vault remains locked.
- **Forgotten vault passphrase:** by design, permanent loss — the UI
  makes this explicit during vault setup (the only place you are told
  this). There is no recovery path.

## Testing failures

Every subsystem above has at least one unit test that:

- supplies a known-corrupt input and asserts quarantine (not crash),
- supplies a valid input and asserts the correct report shape,
- for async decrypt paths: simulates a profile switch mid-restore and
  asserts abort (see `isolation.test.ts`).

When you add a failure mode, add a test for it; when you fix a failure
mode, add a test proving it can't regress.
