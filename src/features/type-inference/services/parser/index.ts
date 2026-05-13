// Public API of the parser service. Re-exports the small surface that the
// pipeline and tests need, so callers never reach into individual files.

export { parseTerm, composeCombinatorTerm } from "./parser";
export { getTerm } from "./formatter";
