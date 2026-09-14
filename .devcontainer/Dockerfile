# Dev container for Wird (optional — used by VS Code Dev Containers)
# and for CI-reproducible environments.
#
# This image is deliberately minimal: Wird has zero native runtime deps,
# so Node 22 on slim Debian plus the Playwright Chromium OS libraries
# is all that's needed.
#
# Keep this file LF-only: CRLF line endings break the RUN backslash
# continuations below on some Docker hosts with a bare shell error.
FROM node:22-slim

# Playwright Chromium OS prerequisites for Debian 12 (bookworm).
# ca-certificates alone is NOT enough: without these shared libraries
# the downloaded Chromium exits on launch. Re-verify the set with
# `npx playwright install --dry-run` whenever the base image moves.
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    libatspi2.0-0 \
  && rm -rf /var/lib/apt/lists/*

ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /workspace

CMD ["npm", "run", "dev"]
