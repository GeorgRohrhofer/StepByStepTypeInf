// View layer — pure presentational component.
//
// Renders the full, stacked list of steps when the user clicks
// "Show all steps". Pure: no state, no effects.

import { StepCard } from "./StepCard";
import type { DisplayStep } from "../types";

type AllStepsListProps = {
  steps: DisplayStep[];
};

export function AllStepsList({ steps }: AllStepsListProps) {
  return (
    <div className="step-all-list" aria-label="All solution steps">
      {steps.map((step, i) => (
        <StepCard key={i} step={step} number={i + 1} variant="stacked" />
      ))}
    </div>
  );
}
