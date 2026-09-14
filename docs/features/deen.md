# Deen journey (STEP 10) — levels, deeds, gamification

Optional, privacy-first Islamic self-improvement inside Wird: five
voluntary tracking levels, quests, a good-deeds library, awareness
reflections, streaks, and achievements. The app **never ranks faith,
calculates reward, counts sins, or leads by shame** (ADR-007).

- Route: `/deen` (nav-listed, sitemap-listed, SW-precached; Today and
  Library tabs, tab state in-memory only — never in URLs).
- Content: `app/lib/deen-catalog.ts` (catalogs only — no user data;
  `verified` vs `personal-goal`/`habit`/`advice` kinds, sources on every
  verified row, shared school-variance notes).
- State: `app/lib/deen.ts` (pure logic + `loadDeen`/`saveDeen` through
  the existing `loadFromStorage`/`saveToStorage` seam — no database, no
  new storage architecture).
- Views: `app/components/views/deen-page.tsx` (tabs),
  `deen-today.tsx` (dashboard), `deen-library.tsx` (library/learn).
- Copy: `dn.*` keys in `app/lib/strings.ts` (AR/EN parity +
  `guidance-safety` scan cover all 316 pairs).

## Contract (what the system promises)

- **Levels are tracking depth**: L1 fard → L2 mustahabb → L3 makruh
  awareness → L4 character → L5 refinement. User-chosen, downgradable
  any time; changing level never touches history. Copy says "Deen
  Level N in Wird", never "Level N Muslim".
- **Wird XP is app activity only**: fixed table (quest 5/10/15, salah
  day 10, deed 5, secret deed 5, reflection 5, chest 3, return 5),
  idempotent ledger (`kind:id:day`, capped 1000) — double-clicks,
  refresh-during-reward, and multi-tab completions pay once. XP is
  never negative, never revoked, never called hasanat/faith/reward.
- **No sin counters, no negative XP, no leaderboards, no faith
  scores**: haram/speech reflections store answers only (no/yes/
  unsure/skip + optional trigger/next); metrics show five separate
  tracked-behavior rates, never one percentage of worth.
- **Kinds stay honest**: ordinary habits (scrolling, overeating, idle
  talk) are `habit`, never auto-labeled makruh; character items are
  `personal-goal`; verified rows carry checkable references (famous
  verses only) and await reviewer sign-off (CONTENT_RIGHTS.md).
- **Streaks count recorded days**: continuity-based reset on observed
  gaps (device-clock limitation, LIMITATIONS.md); ending a streak
  resets the count, never history; return copy is shame-free with
  continue/restart/simplify/pause.
- **Gamification is fully offable**: XP/levels/streaks/combos/
  achievements/quests-display/effects each hide independently; tracking
  keeps working underneath.
- **Young-user safe**: neutral examples only (gaming, scrolling, TV,
  anger, arguments, wasting time, overeating); no diagnosis, no
  outcomes promised, no adult-only content.
- **Private by default**: `wird-deen-v1` is `sensitive`-classified,
  firewall-guarded (`privacy-firewall.test.ts` deen section — engines
  import neither the module nor the catalog), excluded from analytics,
  shares, notifications, URLs, and titles; day records prune after 365
  days; explicit erase with confirm.

## Data model (`wird-deen-v1`, per-profile, schema v1)

`{ v, level 1–5, xpTotal, awards[], quests[], achievements{id: day},
streaks{salah,quran,reflection,deed,habit}, days{dayId: DayDeen},
customs{deeds,rules}, settings{7 toggles}, returnCount, lastOpenDay }`.
DayDeen: salah marks (done/late/missed, no explanation demanded),
deeds, secretDeed, character, reduce, speech answers, reflection +
short note (≤140), questsDone, chestOpened, minimumDay.

## Tests

- Unit (`app/lib/__tests__/deen.test.ts`, 20 tests): XP single-award
  under rapid duplicates, level changes preserve history, quest
  lifecycle, streak build/reset, return XP, combo areas, achievement
  earning, scoreless reflections, catalog kinds/sources, validation
  clamps, banned-concept absence in state shape.
- E2E (`e2e/deen.spec.ts`, 5 tests): render + salah persistence across
  reload, double-completion single award, level-up + gamification-off
  tracking, library sources + scoreless speech check, offline open +
  URL/title leak scan.

## Deliberately not built (future work, not silent gaps)

- Check-in notes display (stored; surfacing belongs to a timeline pass).
- Adaptive deen suggestions (engines are firewall-barred by design —
  any future suggestion surface needs an ADR first).
- OS-level habit enforcement (belongs to the separate companion
  project, never Wird).
