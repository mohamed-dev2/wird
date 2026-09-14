// SPDX-License-Identifier: Apache-2.0
// Deen route (/deen): the STEP 10 journey space — today dashboard plus
// library/learning tabs (in-memory tab state, no URL params, static
// generic title). Server component; views own all client state.
import type { Metadata } from "next";
import { DeenPage } from "../components/views/deen-page";

export const metadata: Metadata = { title: "دين" };

export default function DeenRoute() {
  return <DeenPage />;
}
