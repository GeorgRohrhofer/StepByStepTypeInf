// View layer — page-level composer for the `help` feature.
//
// Renders the floating "?" button plus, when open, the help dialog. State
// and side effects live in the controller hook (`useHelpPanel`); this
// component only wires the ref and forwards callbacks. The conditional
// here is a render conditional (mount/unmount the panel), not a business
// decision.

import { useHelpPanel } from "../hooks/useHelpPanel";
import { HelpPanel } from "./HelpPanel";

export function HelpFab() {
  const { isOpen, wrapperRef, toggle, close } = useHelpPanel();

  return (
    <div className="help-fab" ref={wrapperRef}>
      <button
        type="button"
        className="help-fab__btn"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls="app-help-panel"
        aria-label="How to use"
      >
        ?
      </button>
      {isOpen ? <HelpPanel onClose={close} /> : null}
    </div>
  );
}
