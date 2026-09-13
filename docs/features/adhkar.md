# Adhkar (daily remembrances)

Daily remembrance group with per-group counters, persisted via
`wird-adhkar-log-v1`.

- Core catalog: `app/lib/wird.ts` (section/habit definitions).
- UI: `app/components/views/adhkar.tsx`.

**Key behaviors:**

- Group counts are updated in-place per session; daily reset is driven
  by `wird-adhkar-log-v1` + `wird-lastseen-v1`.
- Count data is `private` sensitivity; nothing leaves the device.

**Religious content:** the adhkar text itself lives in the curated data
catalog (Arabic only); translations, if added, follow the same review
rules as any religious text addition
(`docs/HOW_TO_ADD_RELIGIOUS_CONTENT.md`).
