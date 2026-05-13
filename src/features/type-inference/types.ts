// Model layer for the `type-inference` feature.
//
// Per the architecture rule "types are co-located with their domain", the
// core lambda-calculus models (`Term`, `Type`) live here rather than under
// a generic `shared/` bucket — they are only meaningful within the type
// inference feature.
//
// `DisplayStep` is the view-model shape consumed by every view in this
// feature; it is what the controller hook produces and what the view
// components render.
//
// Trace types are re-exported from the inference service so consumers of
// this feature can import everything from `features/type-inference/types`
// instead of reaching into service internals.

export type Type =
  | { kind: "var"; name: string }
  | { kind: "fun"; from: Type; to: Type };

export type Term =
  | { kind: "var"; name: string }
  | { kind: "abs"; param: string; paramType?: Type; body: Term }
  | { kind: "app"; func: Term; arg: Term };

/**
 * Shape consumed by the view layer. One `DisplayStep` renders as one card
 * (title plus a list of pre-formatted monospace lines).
 */
export type DisplayStep = {
  title: string;
  lines: string[];
};

/** Output of `runPipeline`: an ordered list of view-ready steps plus an
 *  optional error to surface in a banner. */
export type PipelineResult = {
  steps: DisplayStep[];
  error: string | null;
};

export type {
  InferenceTraceStep,
  InferenceTraceOutcome,
} from "./services/inference";
