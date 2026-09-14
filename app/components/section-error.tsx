// Section error boundary (STEP 7.3) + safe-mode banner (STEP 7.13).
// A crash inside one area (analytics, companion, library widgets) shows a
// calm recovery card with Try-again — never a blank screen, never a claim
// about lost data (nothing is claimed lost unless verified, and nothing
// here verifies loss). Copy comes from props (translated by the caller)
// so this file never touches content rules.
"use client";

import { Component, type ReactNode } from "react";
import { useT } from "../lib/i18n";

/** Random 16-hex diagnostic id. Content-free: safe to show and quote. */
export function newErrorId(): string {
  try {
    const b = new Uint8Array(8);
    crypto.getRandomValues(b);
    return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  } catch {
    return Math.floor(Math.random() * 0xfffffffffffffff)
      .toString(16)
      .padStart(12, "0")
      .slice(-16);
  }
}

type GuardProps = { title: string; body: string; retry: string; children: ReactNode };
type GuardState = { failed: boolean; errorId: string };

export class SectionError extends Component<GuardProps, GuardState> {
  state: GuardState = { failed: false, errorId: "" };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- React passes the error; ignoring it is the privacy contract (never render it)
  static getDerivedStateFromError(_error: unknown): GuardState {
    return { failed: true, errorId: newErrorId() };
  }

  componentDidCatch(): void {
    // Deliberately unlogged: no server, no log persistence, and console.*
    // is banned (privacy — logs could leak user content). The errorId lets
    // the user reference the failure without exposing anything.
  }

  private reset = (): void => {
    this.setState({ failed: false, errorId: "" });
  };

  render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="pp-card" role="alert">
        <p>
          <b>{this.props.title}</b>
        </p>
        <p className="backup-msg">{this.props.body}</p>
        <p className="backup-msg">#{this.state.errorId}</p>
        <div className="backup-actions">
          <button type="button" className="pp-btn-ghost" onClick={this.reset}>
            {this.props.retry}
          </button>
        </div>
      </div>
    );
  }
}

/** Localized wrapper (class components cannot use hooks). */
export function SectionGuard({ children }: { children: ReactNode }) {
  const t = useT();
  return (
    <SectionError title={t("err.secT")} body={t("err.secB")} retry={t("err.retry")}>
      {children}
    </SectionError>
  );
}

/** Always-visible safe-mode banner with an exit (STEP 7.13). */
export function SafeBanner({ onExit }: { onExit: () => void }) {
  const t = useT();
  return (
    <div className="pp-card pp-emergency-card" role="status">
      <p>
        <b>{t("safe.banner")}</b>
      </p>
      <div className="backup-actions">
        <button type="button" className="pp-btn-ghost" onClick={onExit}>
          {t("safe.exit")}
        </button>
      </div>
    </div>
  );
}
