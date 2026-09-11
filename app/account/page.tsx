"use client";

import { useWird } from "../components/wird-store";
import { AccountView } from "../components/views/account";

export default function AccountPage() {
  const { resetDay } = useWird();
  return <AccountView onReset={resetDay} />;
}
