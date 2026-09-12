// Account route (/account): thin wrapper — all UI lives in AccountView.
// Keeps route files uniform: data + behavior in components/views/.
"use client";

import { useWird } from "../components/wird-store";
import { AccountView } from "../components/views/account";

export default function AccountPage() {
  const { resetDay } = useWird();
  return <AccountView onReset={resetDay} />;
}
