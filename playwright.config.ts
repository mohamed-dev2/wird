import { defineConfig } from "@playwright/test";

const baseURL = process.env.PW_BASE_URL ?? "http://127.0.0.1:3119";

export default defineConfig({
  testDir: "./e2e",
  // NOTE: e2e runs against a production server, not `next dev` — the dev
  // HMR websocket is unreliable in sandboxed CI and breaks hydration there.
  webServer: process.env.PW_BASE_URL
    ? undefined
    : {
        command: "npm run build && npx next start --port 3119",
        url: "http://127.0.0.1:3119/",
        reuseExistingServer: true,
        timeout: 300000,
      },
  use: { baseURL },
});
