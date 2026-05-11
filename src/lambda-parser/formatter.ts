import type { Term } from "../shared/types";

export function getTerm(term: Term): string {
  return formatTerm(term, 0);
}

function formatTerm(term: Term, parentPrecedence: number): string {
  switch (term.kind) {
    case "var":
      return term.name;
    case "abs": {
      const rendered = `\\${term.param}.${formatTerm(term.body, 1)}`;
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
