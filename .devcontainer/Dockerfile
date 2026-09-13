# Dev container for Wird (optional — used by VS Code Dev Containers)
# and for CI-reproducible environments.
#
# This image is deliberately minimal: Wird has zero native runtime deps,
# so Node 22 on slim Debian is all that's needed.
FROM node:22-slim

# deps : playwright browser prerequisites (kept minimal/known-stable)
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /workspace

CMD ["npm", "run", "dev"]