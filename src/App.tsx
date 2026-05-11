import "./App.css";
import {
  collectBetaReductionSteps,
  infereTypeWithTrace,
  type InferenceTraceStep,
} from "./inference-engine/inference";
import {
  replaceParamWithType,
  resetTypeNameCounter,
} from "./inference-engine/type-replace";
import { parseTerm, getTerm } from "./lambda-parser/parser";
import { Failure } from "./shared/errors";
import {
  useCallback,
  useEffect,
  useState,
  type SubmitEventHandler,
} from "react";

type DisplayStep = {
  title: string;
  lines: string[];
};

function expandInferenceTraceStep(step: InferenceTraceStep): DisplayStep[] {
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

function runPipeline(input: string): {
  steps: DisplayStep[];
  error: string | null;
} {
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
      const s = betaSteps[i];
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

  console.log(`Time taken: ${performance.now() - startTime}ms`);

  return { steps, error: null };
}

function App() {
  const [input, setInput] = useState("");
  const [steps, setSteps] = useState<DisplayStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [showAllSteps, setShowAllSteps] = useState(false);

  const stepCount = steps.length;
  const lastIndex = Math.max(0, stepCount - 1);
  const viewIndex = Math.min(Math.max(0, stepIndex), lastIndex);
  const currentStep = stepCount > 0 ? steps[viewIndex] : null;

  const goPrev = useCallback(() => {
    setStepIndex((i) => {
      const clamped = Math.min(Math.max(0, i), lastIndex);
      return Math.max(0, clamped - 1);
    });
  }, [lastIndex]);

  const goNext = useCallback(() => {
    setStepIndex((i) => Math.min(lastIndex, i + 1));
  }, [lastIndex]);

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const { steps: next, error: err } = runPipeline(input);
    setSteps(next);
    setError(err);
    setStepIndex(0);
    setShowAllSteps(false);
  };

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

  return (
    <main className={`app ${showAllSteps ? "app--show-all" : ""}`}>
      <div className="app-inner">
        <div className="app-body">
          <h1>Step-By-Step Type Inference</h1>

          {currentStep !== null && (
            <section
              className="step-viewer"
              aria-label="Solution steps"
              aria-live="polite"
            >
              <div className="step-viewer-frame">
                <button
                  type="button"
                  className="step-nav step-nav--prev"
                  onClick={goPrev}
                  disabled={viewIndex <= 0}
                  aria-label="Previous step"
                >
                  ‹
                </button>
                <div className="step-viewer-main">
                  <article
                    className="step-card step-card--current"
                    key={viewIndex}
                  >
                    <h2 className="step-title">
                      <span className="step-title-num">{viewIndex + 1}. </span>
                      {currentStep.title}
                    </h2>
                    <div className="step-body">
                      {currentStep.lines.map((line, j) => (
                        <pre key={j} className="step-line">
                          {line}
                        </pre>
                      ))}
                    </div>
                  </article>
                  <div className="step-viewer-meta">
                    <span className="step-counter">
                      Step {viewIndex + 1} of {stepCount}
                    </span>
                    <label className="step-scrub">
                      <span className="visually-hidden">Jump to step</span>
                      <input
                        type="range"
                        min={0}
                        max={lastIndex}
                        value={viewIndex}
                        onChange={(e) =>
                          setStepIndex(Number.parseInt(e.target.value, 10))
                        }
                        aria-valuetext={`Step ${viewIndex + 1} of ${stepCount}`}
                      />
                    </label>
                  </div>
                </div>
                <button
                  type="button"
                  className="step-nav step-nav--next"
                  onClick={goNext}
                  disabled={viewIndex >= lastIndex}
                  aria-label="Next step"
                >
                  ›
                </button>
              </div>
              <div className="step-viewer-footer">
                <button
                  type="button"
                  className="step-show-all"
                  onClick={() => setShowAllSteps((v) => !v)}
                  aria-expanded={showAllSteps}
                >
                  {showAllSteps ? "Hide all steps" : "Show all steps"}
                </button>
              </div>
              {showAllSteps && (
                <div className="step-all-list" aria-label="All solution steps">
                  {steps.map((step, i) => (
                    <article className="step-card step-card--stacked" key={i}>
                      <h2 className="step-title">
                        <span className="step-title-num">{i + 1}. </span>
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
                  ))}
                </div>
              )}
            </section>
          )}

          {error !== null && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}
        </div>

        <form className="type-input" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"e.g. (\\x.x) y"}
            aria-label="Lambda term"
          />
          <button type="submit">Run</button>
        </form>
      </div>
    </main>
  );
}

export default App;
