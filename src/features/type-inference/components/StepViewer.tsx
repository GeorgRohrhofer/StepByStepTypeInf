// View layer — presentational composite component.
//
// Composes `StepNav`, `StepCard`, `StepScrub`, and `AllStepsList` into the
// "step viewer" section. No state of its own and no business logic —
// every value and every callback is supplied by the controller hook via
// props. The only conditional is a render conditional (whether the
// "show all" list is mounted), which is a presentation concern and so is
// allowed in a view.

import { AllStepsList } from "./AllStepsList";
import { StepCard } from "./StepCard";
import { StepNav } from "./StepNav";
import { StepScrub } from "./StepScrub";
import type { DisplayStep } from "../types";

type StepViewerProps = {
  steps: DisplayStep[];
  currentStep: DisplayStep;
  viewIndex: number;
  lastIndex: number;
  stepCount: number;
  showAllSteps: boolean;
  onPrev: () => void;
  onNext: () => void;
  onGoToStep: (index: number) => void;
  onToggleShowAllSteps: () => void;
};

export function StepViewer({
  steps,
  currentStep,
  viewIndex,
  lastIndex,
  stepCount,
  showAllSteps,
  onPrev,
  onNext,
  onGoToStep,
  onToggleShowAllSteps,
}: StepViewerProps) {
  return (
    <section
      className="step-viewer"
      aria-label="Solution steps"
      aria-live="polite"
    >
      <div className="step-viewer-frame">
        <StepNav direction="prev" onClick={onPrev} disabled={viewIndex <= 0} />
        <div className="step-viewer-main">
          {/* `key` resets card animations when the user moves between steps. */}
          <StepCard
            key={viewIndex}
            step={currentStep}
            number={viewIndex + 1}
            variant="current"
          />
          <div className="step-viewer-meta">
            <span className="step-counter">
              Step {viewIndex + 1} of {stepCount}
            </span>
            <StepScrub
              viewIndex={viewIndex}
              lastIndex={lastIndex}
              stepCount={stepCount}
              onChange={onGoToStep}
            />
          </div>
        </div>
        <StepNav
          direction="next"
          onClick={onNext}
          disabled={viewIndex >= lastIndex}
        />
      </div>
      <div className="step-viewer-footer">
        <button
          type="button"
          className="step-show-all"
          onClick={onToggleShowAllSteps}
          aria-expanded={showAllSteps}
        >
          {showAllSteps ? "Hide all steps" : "Show all steps"}
        </button>
      </div>
      {showAllSteps && <AllStepsList steps={steps} />}
    </section>
  );
}
