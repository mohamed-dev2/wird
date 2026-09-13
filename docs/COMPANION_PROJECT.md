# Privacy Companion project (design record — NOT in this codebase)

Status: **not started, not in Wird, no code here.** This document records
the boundary decision and the integration contract so a future,
separate, security-sensitive project can start from agreed principles.
Per the STEP 5 brief: do not rush restriction/blocking enforcement into
the Wird codebase.

## The two projects

- **Project A — Wird (this repo)**: Islamic personal growth, reflection,
  habits, Quran, goals, private self-management (`docs/features/
private-recovery.md`). Self-tracking and support, never enforcement.
- **Project B — Privacy / Digital Recovery Companion (separate repo)**:
  user-controlled digital restriction, blocking, and bypass-resistant
  habit-support infrastructure. Enforcement, never surveillance.

The two may integrate later. They must not be architecturally fused:
Wird stays a local-first tracker with no OS-level power; the companion
owns every platform integration.

## Non-negotiable principles (carried over from the brief)

- **User-controlled, never surveillance**: the user chooses what to
  restrict; the software never decides. No secret monitoring of browsing
  history, messages, keystrokes, screenshots, microphone, camera, files,
  or private communications. No hidden persistence, no rootkits, no
  boot/system modification, no antivirus interference.
- **A tool for keeping a voluntary commitment** — friction and deliberate
  recovery (unlock → confirm → wait period → authentication), never
  imprisonment. Emergency unlock always exists.
- **No impossible promises**: never "impossible to bypass" or "even
  root/admin cannot remove". Document per-platform bypass resistance
  honestly ("harder under the documented threat model"), including the
  Linux axiom that root is root.
- **OS-legitimate mechanisms only**: Screen Time / Family Controls /
  Managed Settings (Apple), Digital Wellbeing / VPN APIs / parental
  controls (Android), firewall/DNS/policy/family controls (Windows),
  Screen Time/NetworkExtension/managed config (macOS), DNS/firewall/hosts
  (Linux). No jailbreaks, exploits, stealth persistence, or accessibility
  APIs abused as surveillance.
- **Transparent layers**: any VPN/DNS/proxy/browser/app-blocking layer
  must disclose what traffic it handles, what leaves the device, and what
  is logged. Prefer on-device processing. Rules inspectable
  (`domain → action → user-created reason`); community lists sourced,
  licensed, documented, and disableable.
- **Local-first, no telemetry by default**: no blocked-URL / history /
  usage collection unless the user explicitly enables a documented local
  diagnostic. Bypass-attempt counters stay local and coarse ("3 blocked
  attempts today", never URLs) unless finer local logging is explicitly
  configured.
- **Open-source everything**: filtering logic, networking, storage,
  permissions, platform integrations, telemetry, update mechanism —
  auditable, with its own repo, threat model, docs, security review,
  legal review, tests, and release process.

## Integration contract with Wird (if ever built)

- Optional, explicit opt-in on both sides.
- Wird receives only safe high-level status (`Protection active /
inactive`) — never blocked domains, history, or URLs.
- The companion never receives Wird's private data (plans, reflections,
  mood, notes) unless the user separately opts that in.
- No shared codebase, no shared storage, no shared release train.

## Why this stays out of Wird

Restriction enforcement needs OS privileges, background execution, and a
threat model (tamper resistance, bypass analysis, uninstall protection)
that contradict Wird's: a tiny, auditable, sandbox-confined web app whose
entire privacy story is "your data never leaves your device and nobody
— not even us — can reach it." Fusing them would weaken both promises.
