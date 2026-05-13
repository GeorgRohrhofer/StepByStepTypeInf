// Service layer.
//
// `runPipeline` is the orchestration entry point of the feature: it takes
// the raw user input and produces the list of view-ready `DisplayStep`s
// (plus an optional error). It is a pure function — no React, no DOM —
// which keeps the controller hook trivial and the view layer ignorant of
// the parser, β-reducer, renamer, and inferencer.
//
// This used to live inside `App.tsx`; the move is the central refactor.

import { Failure } from "../../../shared/utils/result";
import {
  collectBetaReductionSteps,
  infereTypeWithTrace,
  replaceParamWithType,
  resetTypeNameCounter,
} from "./inference";
import { parseTerm, getTerm } from "./parser";
import { expandInferenceTraceStep } from "./trace-formatter";
import type { DisplayStep, PipelineResult } from "../types";

export function runPipeline(input: string): PipelineResult {
  const startTime = performance.now();
  const steps: DisplayStep[] = [];

  const parsed = parseTerm(input);
  if (parsed instanceof Failure) {
    return { steps: [], error: parsed.error };
  }

  const parsedTerm = parsed.value;
  steps.push({
    title: "Parse — Read the λ-Term",
    lines: [
      "Treat the input as a tree of variables, applications (M N), and abstractions (λx.M).",
    ],
  });
  steps.push({
    title: "Parse — Abstract Syntax Tree",
    lines: [getTerm(parsedTerm)],
  });

  const { term: afterBeta, steps: betaSteps } =
    collectBetaReductionSteps(parsedTerm);
  if (betaSteps.length === 0) {
    steps.push({
      title: "β-Reduction — Look for a Redex",
      lines: [
        "A redex is a subterm (λx.M) N. If none exists, there is nothing to contract.",
        "No redex here (already a normal form, or no applicable redex).",
      ],
    });
  } else {
    for (let i = 0; i < betaSteps.length; i++) {
      const s = betaSteps[i]!;
      const n = betaSteps.length;
      steps.push({
        title: `β-Reduction (${i + 1}/${n}) — Locate the Redex`,
        lines: [
          "Leftmost-outermost: find the first (λx.M) N from the left.",
          `Before:  ${getTerm(s.from)}`,
        ],
      });
      steps.push({
        title: `β-Reduction (${i + 1}/${n}) — Contract One Step`,
        lines: [`${getTerm(s.from)}  →  ${getTerm(s.to)}`],
      });
    }
  }

  resetTypeNameCounter();
  const renamed = replaceParamWithType(afterBeta);
  if (renamed instanceof Failure) {
    return { steps, error: renamed.error };
  }

  const renamedTerm = renamed.value;
  steps.push({
    title: "Rename — Prepare for Type Inference",
    lines: [
      "Bound parameters are renamed to metavariable-style names so each binder lines up with a type variable in the algorithm.",
    ],
  });
  steps.push({
    title: "Rename — Term Passed to Inference",
    lines: [getTerm(renamedTerm)],
  });

  const inferred = infereTypeWithTrace(renamedTerm);
  for (const traceStep of inferred.steps) {
    for (const d of expandInferenceTraceStep(traceStep)) {
      steps.push(d);
    }
  }

  if (inferred.outcome === "error") {
    return { steps, error: inferred.error };
  }

  // Pre-existing diagnostic log; not view logic, so it lives in the service.
  console.log(`Time taken: ${performance.now() - startTime}ms`);

  return { steps, error: null };
}
