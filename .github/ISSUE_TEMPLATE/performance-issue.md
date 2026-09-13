---
name: Performance problem
about: Slow load, slow interactions, or memory/CPU issue
title: "[perf] "
labels: performance
---

## What is slow

- [ ] Page load
- [ ] A specific interaction (which?)
- [ ] Memory growth over time
- [ ] Analytics/insights computation
- [ ] Backup export/import

## Repro & measurement

1. Steps (include profile age / history size if relevant):
2. Measured numbers (LCP, interaction time, memory usage; dev-tools
   screenshots ok)
3. Browser/OS/device (low-end mobile especially relevant):

## Context

Connect the symptom to a subsystem: docs/PERFORMANCE.md and the analytics
path (app/lib/analytics.ts) are the usual suspects. Suggesting a synthetic
repro brings it to the top of the queue.
