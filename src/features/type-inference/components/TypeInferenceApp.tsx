// View layer — page-level composer for the type-inference feature.
//
// Calls the feature's controller hook once and threads the resulting data
// and callbacks into the child views. No state of its own, no effects,
// no business decisions. Conditionals here are pure render conditionals
// (e.g. "do we have a current step to show?"), which is permitted in a
// view component.

import { useTypeInference } from "../hooks/useTypeInference";
import { ErrorBanner } from "./ErrorBanner";
import { StepViewer } from "./StepViewer";
import { TypeInputForm } from "./TypeInputForm";

export function TypeInferenceApp() {
  const {
    input,
    onInputChange,
    onSubmit,
    steps,
    error,
    stepCount,
    lastIndex,
    viewIndex,
    currentStep,
    goPrev,
    goNext,
    goToStep,
    showAllSteps,
    toggleShowAllSteps,
  } = useTypeInference();

  return (
    <main className={`app ${showAllSteps ? "app--show-all" : ""}`}>
      <div className="app-inner">
        <div className="app-body">
          <header className="app-header">
            <h1>Step-By-Step Type Inference</h1>
          </header>

          {currentStep !== null && (
            <StepViewer
              steps={steps}
              currentStep={currentStep}
              viewIndex={viewIndex}
              lastIndex={lastIndex}
              stepCount={stepCount}
              showAllSteps={showAllSteps}
              onPrev={goPrev}
              onNext={goNext}
              onGoToStep={goToStep}
              onToggleShowAllSteps={toggleShowAllSteps}
            />
          )}

          {error !== null && <ErrorBanner message={error} />}
        </div>

        <TypeInputForm
          value={input}
          onChange={onInputChange}
          onSubmit={onSubmit}
        />
      </div>
    </main>
  );
}
