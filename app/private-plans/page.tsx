// Private plans route (/private-plans): the STEP 4 self-management space.
// Deliberately unlisted from nav/sitemap: reachable from Account → privacy
// and by direct navigation. Server component so the tab title comes from
// static metadata (generic — no sensitive words, no URL params, and no
// imperative document.title for Next's template manager to reconcile).
import type { Metadata } from "next";
import { PrivatePlansView } from "../components/views/private-plans";

export const metadata: Metadata = { title: "خطط خاصة" };

export default function PrivatePlansPage() {
  return <PrivatePlansView />;
}
