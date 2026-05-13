// Service layer / parser submodule.
//
// Pretty-printer for `Term`. Pure function — no React, no I/O, no shared
// mutable state. Lives under `services/parser/` because it is the inverse
// of the parser and shares its character constants.

import { LAMBDA_CHAR_ALT } from "./constants";
import type { Term } from "../../types";

export function getTerm(term: Term): string {
  return formatTerm(term, 0);
}

function formatTerm(term: Term, parentPrecedence: number): string {
  switch (term.kind) {
    case "var":
      return term.name;
    case "abs": {
      const rendered = `${LAMBDA_CHAR_ALT}${term.param}.${formatTerm(term.body, 1)}`;
      if (parentPrecedence > 1) {
        return `(${rendered})`;
      }
      return rendered;
    }
    case "app": {
      const rendered = `${formatTerm(term.func, 2)} ${formatTerm(term.arg, 3)}`;
      if (parentPrecedence > 2) {
        return `(${rendered})`;
      }
      return rendered;
    }
  }
}
