# Adaptive companion — how it decides

Local, deterministic guidance (`app/lib/companion.ts`, content in
`app/lib/content.ts`, UI in `app/components/companion.tsx`). No AI service,
no network, no analytics SDK. Same inputs always produce the same guidance.

## Pipeline

```
history + today + calendar + log
  → assessUser()      26 internal states + personal-baseline metrics
  → selectGuidance()  ranked, fatigue-filtered, confidence-gated
  → verse/hadith refs resolved from verified datasets only
  → ONE card (or nothing)
```

## States (internal names — never shown to users)

First use, new user, first week, active, consistent, strong momentum,
improving, slipping, struggling, quiet opening, 4 absence depths,
returning, rebuilding, strong return, repeated restarts, overload,
challenge milestone, strong/low/recovery day, Friday, Ramadan,
post-Ramadan.

Absence uses **app-absence** (last open, stable for the session);
trends use the **activity gap** (last recorded day). A return counts from
the pre-streak idle gap, so recording today never erases the comeback.

## Ranking (highest first)

Strong return → returning → very-long absence → post-Ramadan → long /
medium / short absence → rebuilding → repeated restarts → quiet opening →
low / strong / recovery day → milestones → slipping → struggling →
improving → momentum → consistent → overload → new / first use →
Ramadan / Friday overlays (which otherwise merge as one line).

## Fatigue

Shown kinds are skipped for 3 days (`wird-guide-log-v1`, capped at 30);
milestones fire once ever per identity. When everything is tired the UI
shows **nothing** — never a repeat. The log snapshot is frozen at mount
so logging can never cascade into re-selection mid-session.

## Confidence

High (≥7 active days) / medium (≥3) / low. Low confidence yields only
gentle generic states — never specific claims ("Mondays…" needs real
samples, and weekday logic already requires ≥3 per weekday).

## Content rules

- Verse **references only** (`{surah, ayah, themes}`); Arabic + translation
  resolve at runtime from the bundled mushaf + Clear Quran. Missing →
  renders nothing.
- Hadith resolve by id from the curated library with book + grade + ref.
- Quran / Hadith / Wird-suggestion blocks are visually and semantically
  separated (`cm.quran` / `cm.hadith` / `cm.guide` labels).
- `guidance-safety.test.ts` scans every rendered AR+EN string for
  revelation markers, rulings, shame, heart-claims, medical or causation
  language.

## The philosophy (binding)

- Close → help continue. Struggling → help simplify.
- Fallen away → leave the door open. Returned → welcome.
- Growing → help stay humble and consistent.
- Never claim to know the heart, iman, sincerity, or divine judgment.
