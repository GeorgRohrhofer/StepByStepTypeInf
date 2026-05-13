// Service layer.
//
// Pure transformer from inference trace events (`InferenceTraceStep`,
// produced by the inference service) to view-ready `DisplayStep[]`. Lives
// in the service layer because it is pure business presentation logic —
// no React, no I/O — and is reusable by anything that needs to render a
// trace (current view, future export, tests).
//
// Previously inlined in `App.tsx`; same behaviour, just relocated.

import type { DisplayStep, InferenceTraceStep } from "../types";

export function expandInferenceTraceStep(
  step: InferenceTraceStep,
): DisplayStep[] {
  switch (step.kind) {
    case "environment":
      return [
        {
          title: "Context — Which Names are Free in the Term?",
          lines: [
            `Free Variables: ${step.bindings.map((b) => b.name).join(", ")}`,
          ],
        },
        {
          title: "Context — Give Each Free Variable a Fresh Type Metavariable",
          lines: step.bindings.map((b) => `${b.name} : ${b.type}`),
        },
      ];
    case "var_lookup":
      return [
        {
          title: "Variable — Read Its Type from the Context",
          lines: [`${step.name} : ${step.type}`],
        },
      ];
    case "assume":
      return [
        {
          title:
            step.source === "fresh"
              ? "λ-Abstraction — Invent a Metavariable for the Parameter Type"
              : "λ-Abstraction — Use the Annotated Parameter Type",
          lines: [`Add to the context:  ${step.param} : ${step.type}`],
        },
      ];
    case "abs_body_next":
      return [
        {
          title: "λ-Abstraction — Move Inward to the Body",
          lines: [
            `With ${step.param} in the context, infer the body under that extended context.`,
          ],
        },
      ];
    case "app_subterms_typed":
      return [
        {
          title: "Application — You Already Inferred Both Sides",
          lines: [
            `Function position has type:  ${step.funcType}`,
            `Argument position has type:   ${step.argType}`,
          ],
        },
      ];
    case "app_rule_constraint":
      return [
        {
          title: "Application — Write the Constraint the Typing Rule Gives",
          lines: [
            `The function type must be an arrow whose domain matches the argument type and whose codomain is the type of the whole application.`,
            `Introduce a fresh metavariable ${step.freshResult} for that result type.`,
            `Constraint to solve:    ${step.funcType}  =  (${step.argType} → ${step.freshResult})`,
          ],
        },
      ];
    case "unify":
      return [
        {
          title: "Unification — State an Equation between Types",
          lines: [`${step.lhs}  =  ${step.rhs}`],
        },
        {
          title: "Unification — Record the Metavariable Solution (Extend σ)",
          lines: [
            `${step.lhs}  ↦  ${step.rhs}`,
            "(Occurs check passed; no infinite type.)",
          ],
        },
      ];
    case "final":
      return [
        {
          title: "Finish — Apply the Substitution to the Inferred Type",
          lines: [
            "Collapse metavariables using the substitution σ built above.",
          ],
        },
        {
          title: "Principal Type of the Term",
          lines: [step.type],
        },
      ];
  }
}
