// SPDX-License-Identifier: Apache-2.0
// Deen route (/deen): the STEP 10 journey space — today dashboard plus
// library/learning and nightly review tabs (in-memory tab state, no URL
// params, static generic title). Server component; views own all client
// state. Review was folded here from /review (permanent redirect).
import type { Metadata } from "next";
import { DeenPage } from "../components/views/deen-page";

export const metadata: Metadata = {
  // Discreet by design: short generic title, one plain description of
  // the public feature — never user data, never scores or ranks.
  title: "دين",
  description: "رحلة الدين: متابعة اليوم، أذكار وتعلم، ومراجعة ليلية خاصة.",
  alternates: { canonical: "/deen" },
  openGraph: {
    title: "دين",
    description: "رحلة الدين: متابعة اليوم، أذكار وتعلم، ومراجعة ليلية خاصة.",
    url: "/deen",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Wird — Daily Companion" }],
  },
};

export default function DeenRoute() {
  return <DeenPage />;
}
