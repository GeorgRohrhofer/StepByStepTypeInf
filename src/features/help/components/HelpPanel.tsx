// View layer — pure presentational component.
//
// The expanded help dialog. Receives only an `onClose` callback from its
// controller; otherwise this is static content. No state, no effects.
// The JSX matches the original `App.tsx` exactly (preserves accessible
// names, ids, and structure for screen readers).

type HelpPanelProps = {
  onClose: () => void;
};

export function HelpPanel({ onClose }: HelpPanelProps) {
  return (
    <div
      id="app-help-panel"
      className="help-menu"
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-help-heading"
    >
      <h3 id="app-help-heading" className="help-menu-title">
        Using this app
      </h3>
      <ol className="help-menu-list">
        <li>
          Enter a λ-term in the field at the bottom (for example{" "}
          <code className="help-menu-code">(\x.x) y</code>).
        </li>
        <li>
          Press <strong>Run</strong> to walk through parsing, β-reduction
          (when applicable), renaming, and type inference.
        </li>
        <li>
          After a run, use the side arrows or the slider to move between
          steps. When focus is not in the input, you can also use the left
          and right arrow keys.
        </li>
        <li>
          <strong>Show all steps</strong> (under the trace) opens the full
          walkthrough in one scrollable list; choose it again to collapse
          back to one step at a time.
        </li>
      </ol>
      <h4 className="help-menu-subtitle">Syntax and symbols</h4>
      <dl className="help-menu-symbols">
        <div className="help-menu-symbol-row">
          <dt>
            <code className="help-menu-code">\</code> or{" "}
            <code className="help-menu-code">λ</code>
          </dt>
          <dd>
            Start a λ-abstraction. Parameters are listed before{" "}
            <code className="help-menu-code">.</code>, then the body (e.g.{" "}
            <code className="help-menu-code">\x.x</code> or{" "}
            <code className="help-menu-code">λx y.y x</code>).
          </dd>
        </div>
        <div className="help-menu-symbol-row">
          <dt>
            <code className="help-menu-code">.</code>
          </dt>
          <dd>Ends the parameter list and begins the abstraction body.</dd>
        </div>
        <div className="help-menu-symbol-row">
          <dt>
            <code className="help-menu-code">:</code>
          </dt>
          <dd>
            Optional type annotation on a parameter; the type runs up to the
            next <code className="help-menu-code">.</code> that closes the
            binder header (parentheses/brackets/braces nest inside the
            annotation).
          </dd>
        </div>
        <div className="help-menu-symbol-row">
          <dt>
            <code className="help-menu-code">( )</code>
          </dt>
          <dd>Group a sub-term or control how application parses.</dd>
        </div>
        <div className="help-menu-symbol-row">
          <dt>Space</dt>
          <dd>
            Function application:{" "}
            <code className="help-menu-code">M N</code> applies{" "}
            <code className="help-menu-code">M</code> to{" "}
            <code className="help-menu-code">N</code>. Chains associate to the
            left: <code className="help-menu-code">M N P</code> is{" "}
            <code className="help-menu-code">(M N) P</code>.
          </dd>
        </div>
        <div className="help-menu-symbol-row">
          <dt>
            <code className="help-menu-code">°</code> or{" "}
            <code className="help-menu-code">•</code>
          </dt>
          <dd>
            Binary composition:{" "}
            <code className="help-menu-code">f ° g</code> (or with{" "}
            <code className="help-menu-code">•</code>) means{" "}
            <code className="help-menu-code">λx. f (g x)</code> with a fresh
            parameter name <code className="help-menu-code">x</code>.
          </dd>
        </div>
        <div className="help-menu-symbol-row">
          <dt>
            <code className="help-menu-code">°</code> /{" "}
            <code className="help-menu-code">•</code>{" "}
            <span className="help-menu-dim">(alone)</span>
          </dt>
          <dd>
            The compose combinator:{" "}
            <code className="help-menu-code">λf.λg.λx.f (g x)</code> (same as
            parenthesized <code className="help-menu-code">(•)</code>).
          </dd>
        </div>
      </dl>
      <button type="button" className="help-menu-close" onClick={onClose}>
        Close
      </button>
    </div>
  );
}
