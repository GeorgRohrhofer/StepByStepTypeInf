// View layer — pure presentational component.
//
// Renders one `DisplayStep` as a card. No state, no effects, no business
// logic; the only conditional here is a stylistic class toggle, not a
// business decision.

import type { DisplayStep } from "../types";

type StepCardProps = {
  step: DisplayStep;
  /** Step number to display in the title (1-based). */
  number: number;
  /** Visual variant: in the carousel ("current") or in the stacked list. */
  variant: "current" | "stacked";
};

export function StepCard({ step, number, variant }: StepCardProps) {
  const variantClass =
    variant === "current" ? "step-card--current" : "step-card--stacked";

  return (
    <article className={`step-card ${variantClass}`}>
      <h2 className="step-title">
        <span className="step-title-num">{number}. </span>
        {step.title}
      </h2>
      <div className="step-body">
        {step.lines.map((line, j) => (
          <pre key={j} className="step-line">
            {line}
          </pre>
        ))}
      </div>
    </article>
  );
}
