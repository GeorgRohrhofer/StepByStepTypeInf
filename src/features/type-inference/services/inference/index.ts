// Public API of the inference service. Exposes only the operations the
// pipeline needs; internal helpers stay private to the submodule.

export {
  collectBetaReductionSteps,
  infereTypeWithTrace,
  infereType,
  betaReduce,
  formatTypeString,
  type InferenceTraceStep,
  type InferenceTraceOutcome,
} from "./inference";
export { replaceParamWithType, resetTypeNameCounter } from "./type-replace";
