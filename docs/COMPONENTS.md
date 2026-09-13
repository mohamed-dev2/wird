# Component catalog

Every visual unit, what it owns, and where its data comes from. Props flow
down; storage writes flow through the store or the owning lib module.

## Chrome

| Component                    | Owns                                                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `components/shell.tsx`       | Sidebar/nav/header, login gating, tilt delegation, auto-lock, install prompt, hidden-tab privacy blur, skip link |
| `components/login-gate.tsx`  | Onboarding, profile picker, PIN unlock + lockout, PIN reset via phrase, duress unlock to decoy                   |
| `components/sw-register.tsx` | Service-worker registration + update banner                                                                      |
| `components/edit-modal.tsx`  | Generic rename dialog (caller persists)                                                                          |

## Today (`app/page.tsx`)

| Component                                                             | Owns                                                          |
| --------------------------------------------------------------------- | ------------------------------------------------------------- |
| Hero / mode-bar / quick-tools                                         | Progress ring, day modes, minimum-plan + now toggles          |
| `companion.tsx` CompanionCard                                         | One ranked guidance + verse/hadith blocks + single action     |
| Return screen (inline)                                                | Tiered welcome-back + tawbah path (replaces page when active) |
| `prayer-arc.tsx`                                                      | Sun arc prev→next prayer from manual times                    |
| Rescue plan (inline)                                                  | One-now, Quran timer, dua, rescue context line                |
| Habit sections / goals / challenges / pledges / qada / fasting / kids | Toggles + add/edit, all via store                             |

## Views (`components/views/`)

`account` (profiles, backup, transfer, reminders, health), `adhkar`
(counters + history log), `calendar` (grid + return/milestone markers),
`now` (moment suggestions), `transfer` (QR/LAN/recovery phrase UI).

## Library (`components/library/`)

`quran-reader` (mushaf + floating action menus + tafsir + audio),
`hadith-library` (curated), `hadith-full` (12-book browser + EN toggle + menus),
`paths-list`, `dreams-board` (organize only — never interprets).

## Analytics (`components/analytics-layers.tsx`)

Eight progressive layers over `lib/analytics.ts`. Each layer shows its
headline first; details expand on demand; nothing renders without
minimum samples (`an.nodata` otherwise).

## Recovery (`app/recovery/page.tsx`)

Deliberately independent of provider STATE: health inspect, emergency
export, backup restore, surgical + full reset. Safe to open when the
main store is broken.
