// Controller layer for the `type-inference` feature.
//
// Owns *all* feature state and side effects:
//   - input text the user types,
//   - the produced `DisplayStep[]` and error,
//   - which step is currently being viewed,
//   - whether the "show all steps" panel is expanded,
//   - the global keyboard navigation effect.
//
// Returns a single, narrow object: the data the view needs and the
// callbacks the view must call. Views never reach into state directly,
// never see the `runPipeline` service, and never wire effects themselves.

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEventHandler,
} from "react";
import { runPipeline } from "../services/pipeline";
import type { DisplayStep } from "../types";

export type UseTypeInferenceReturn = {
  /** Current text in the input field. */
  input: string;
  /** Controlled `onChange` handler for the input field. */
  onInputChange: (value: string) => void;
  /** Submit handler for the form; runs the pipeline. */
  onSubmit: FormEventHandler<HTMLFormElement>;

  /** All view-ready steps from the latest run. */
  steps: DisplayStep[];
  /** Error message from the latest run, or null. */
  error: string | null;

  /** Total number of steps (== `steps.length`, exposed for view convenience). */
  stepCount: number;
  /** Index of the last addressable step (max(0, stepCount - 1)). */
  lastIndex: number;
  /** Clamped index of the currently visible step. */
  viewIndex: number;
  /** The currently visible step, or null if nothing has been run yet. */
  currentStep: DisplayStep | null;

  /** Navigate to the previous step (no-op at the start). */
  goPrev: () => void;
  /** Navigate to the next step (no-op at the end). */
  goNext: () => void;
  /** Jump directly to a given step index. */
  goToStep: (index: number) => void;

  /** Whether the "show all steps" stacked list is expanded. */
  showAllSteps: boolean;
  /** Toggle the "show all steps" stacked list. */
  toggleShowAllSteps: () => void;
};

export function useTypeInference(): UseTypeInferenceReturn {
  const [input, setInput] = useState<string>("");
  const [steps, setSteps] = useState<DisplayStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [showAllSteps, setShowAllSteps] = useState<boolean>(false);

  // Derived values — computed during render, never stored in state.
  // Aligns with AGENTS.md "Calculate Derived State During Rendering".
  const stepCount = steps.length;
  const lastIndex = Math.max(0, stepCount - 1);
  const viewIndex = Math.min(Math.max(0, stepIndex), lastIndex);
  const currentStep = stepCount > 0 ? (steps[viewIndex] ?? null) : null;

  // Functional updater form (AGENTS.md "Use Functional setState Updates") so
  // these callbacks stay stable across renders and never close over stale
  // state.
  const goPrev = useCallback(() => {
    setStepIndex((i) => {
      const clamped = Math.min(Math.max(0, i), lastIndex);
      return Math.max(0, clamped - 1);
    });
  }, [lastIndex]);

  const goNext = useCallback(() => {
    setStepIndex((i) => Math.min(lastIndex, i + 1));
  }, [lastIndex]);

  const goToStep = useCallback(
    (index: number) => {
      setStepIndex(Math.min(Math.max(0, index), lastIndex));
    },
    [lastIndex],
  );

  const toggleShowAllSteps = useCallback(() => {
    setShowAllSteps((v) => !v);
  }, []);

  const onInputChange = useCallback((value: string) => {
    setInput(value);
  }, []);

  const onSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
    (event) => {
      event.preventDefault();
      // Interaction logic in the event handler (AGENTS.md
      // "Put Interaction Logic in Event Handlers") — not in an effect.
      const { steps: next, error: err } = runPipeline(input);
      setSteps(next);
      setError(err);
      setStepIndex(0);
      setShowAllSteps(false);
    },
    [input],
  );

  // Keyboard navigation is a controller-level side effect (it consumes and
  // updates feature state). Belongs here, not in a view component.
  useEffect(() => {
    if (stepCount === 0) {
      return;
    }

    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true]")) {
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setStepIndex((i) => {
          const clamped = Math.min(Math.max(0, i), lastIndex);
          return Math.max(0, clamped - 1);
        });
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setStepIndex((i) => Math.min(lastIndex, i + 1));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [stepCount, lastIndex]);

  // Bundle the return value with useMemo so the object reference is stable
  // for any consumers that put it into deps. The fields it contains all
  // already have stable references thanks to useCallback / derivation.
  return useMemo<UseTypeInferenceReturn>(
    () => ({
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
    }),
    [
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
    ],
  );
}
