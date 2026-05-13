// Service layer / parser submodule.
//
// Lambda-calculus parser. Pure function exposed via `parseTerm`; the
// `Parser` class is intentionally not exported. Business logic is unchanged
// from the previous `src/lambda-parser/parser.ts` — only imports were
// updated to reach the new domain types (`Term`) and shared `Result`
// utilities.

import { Failure, Success, type Result } from "../../../../shared/utils/result";
import type { Term } from "../../types";
import {
  LAMBDA_CHAR,
  LAMBDA_CHAR_ALT,
  COMPOSE_CHAR,
  COMPOSE_CHAR_ALT,
} from "./constants";
export { getTerm } from "./formatter";

export function parseTerm(input: string): Result<Term, string> {
  const parser = new Parser(input);
  return parser.parse();
}

/** `(•)` : λf.λg.λx.f (g x) */
export function composeCombinatorTerm(): Term {
  const f = "f";
  const g = "g";
  const x = "x";
  return {
    kind: "abs",
    param: f,
    body: {
      kind: "abs",
      param: g,
      body: {
        kind: "abs",
        param: x,
        body: {
          kind: "app",
          func: { kind: "var", name: f },
          arg: {
            kind: "app",
            func: { kind: "var", name: g },
            arg: { kind: "var", name: x },
          },
        },
      },
    },
  };
}

function freeTermVars(term: Term, bound: Set<string> = new Set()): Set<string> {
  if (term.kind === "var") {
    return bound.has(term.name) ? new Set() : new Set([term.name]);
  }

  if (term.kind === "app") {
    return new Set([
      ...freeTermVars(term.func, bound),
      ...freeTermVars(term.arg, bound),
    ]);
  }

  const next = new Set(bound);
  next.add(term.param);
  return freeTermVars(term.body, next);
}

/** `f • g`  ≡  λx. f (g x) with fresh x */
function composeBinary(f: Term, g: Term): Term {
  const used = new Set([...freeTermVars(f), ...freeTermVars(g)]);
  const tryNames = ["x", "y", "z", "u", "v", "w"];
  let param: string | undefined;
  for (const n of tryNames) {
    if (!used.has(n)) {
      param = n;
      break;
    }
  }

  if (param === undefined) {
    let i = 0;
    while (used.has(`x${i}`)) {
      i += 1;
    }

    param = `x${i}`;
  }

  return {
    kind: "abs",
    param,
    body: {
      kind: "app",
      func: f,
      arg: {
        kind: "app",
        func: g,
        arg: { kind: "var", name: param },
      },
    },
  };
}

class Parser {
  private readonly input: string;
  private index: number;

  constructor(input: string) {
    this.input = input;
    this.index = 0;
  }

  parse(): Result<Term, string> {
    this.skipWhitespace();
    if (this.isAtEnd()) {
      return new Failure("Input is empty");
    }

    const parsed = this.parseExpression();
    if (parsed.isFailure) {
      return parsed;
    }

    this.skipWhitespace();
    if (!this.isAtEnd()) {
      return new Failure(
        `Unexpected token '${this.currentChar()}' at position ${this.index}`,
      );
    }

    return parsed;
  }

  private parseExpression(): Result<Term, string> {
    this.skipWhitespace();
    if (
      this.currentChar() === LAMBDA_CHAR ||
      this.currentChar() === LAMBDA_CHAR_ALT
    ) {
      return this.parseAbstraction();
    }

    const first = this.parseApplication();
    if (!first.isSuccess) {
      return first;
    }

    let term = first.value;
    while (true) {
      this.skipWhitespace();
      if (
        this.currentChar() !== COMPOSE_CHAR ||
        this.currentChar() != COMPOSE_CHAR_ALT
      ) {
        break;
      }

      this.consumeChar();
      this.skipWhitespace();
      const right = this.parseApplication();
      if (!right.isSuccess) {
        return right;
      }

      term = composeBinary(term, right.value);
    }

    return new Success(term);
  }

  private parseAbstraction(): Result<Term, string> {
    this.consumeChar();
    const params: string[] = [];

    while (true) {
      this.skipWhitespace();
      const param = this.readIdentifier();
      if (param === null) {
        return new Failure(`Expected parameter name at position ${this.index}`);
      }

      params.push(param);
      this.skipWhitespace();

      if (this.currentChar() === ":") {
        this.consumeChar();
        const typeAnnotation = this.skipTypeAnnotation();
        if (typeAnnotation.isFailure) {
          return typeAnnotation;
        }
        this.skipWhitespace();
      }

      if (this.currentChar() === ".") {
        this.consumeChar();
        break;
      }

      if (!isIdentifierStartChar(this.currentChar())) {
        return new Failure(
          `Expected '.' or another parameter after '${param}' at position ${this.index}`,
        );
      }
    }

    this.skipWhitespace();

    if (this.isAtEnd()) {
      return new Failure(
        `Expected abstraction body after position ${this.index}`,
      );
    }

    const body = this.parseExpression();
    if (!body.isSuccess) {
      return body;
    }

    let term: Term = body.value;
    for (let i = params.length - 1; i >= 0; i--) {
      term = { kind: "abs", param: params[i]!, body: term };
    }

    return new Success(term);
  }

  private parseApplication(): Result<Term, string> {
    const first = this.parseAtom();
    if (!first.isSuccess) {
      return first;
    }

    let term = first.value;

    while (true) {
      const checkpoint = this.index;
      this.skipWhitespace();

      if (!this.canStartAtom()) {
        this.index = checkpoint;
        break;
      }

      const next = this.parseAtom();
      if (!next.isSuccess) {
        return next;
      }

      term = {
        kind: "app",
        func: term,
        arg: next.value,
      };
    }

    return new Success(term);
  }

  private parseAtom(): Result<Term, string> {
    this.skipWhitespace();

    const char = this.currentChar();
    if (char === COMPOSE_CHAR || char === COMPOSE_CHAR_ALT) {
      this.consumeChar();
      return new Success(composeCombinatorTerm());
    }

    if (char === "(") {
      this.consumeChar();
      const inner = this.parseExpression();
      if (inner.isFailure) {
        return inner;
      }

      this.skipWhitespace();
      if (this.currentChar() !== ")") {
        return new Failure(`Expected ')' at position ${this.index}`);
      }

      this.consumeChar();
      return inner;
    }

    const name = this.readIdentifier();
    if (name !== null) {
      return new Success({ kind: "var", name });
    }

    if (char === ")") {
      return new Failure(`Unexpected ')' at position ${this.index}`);
    }

    if (char === undefined) {
      return new Failure(`Unexpected end of input at position ${this.index}`);
    }

    return new Failure(`Unexpected token '${char}' at position ${this.index}`);
  }

  private skipTypeAnnotation(): Result<void, string> {
    let parenDepth = 0;
    let bracketDepth = 0;
    let braceDepth = 0;

    while (!this.isAtEnd()) {
      const char = this.currentChar();
      if (char === undefined) {
        break;
      }

      if (char === "(") {
        parenDepth += 1;
      } else if (char === ")") {
        if (parenDepth > 0) {
          parenDepth -= 1;
        }
      } else if (char === "[") {
        bracketDepth += 1;
      } else if (char === "]") {
        if (bracketDepth > 0) {
          bracketDepth -= 1;
        }
      } else if (char === "{") {
        braceDepth += 1;
      } else if (char === "}") {
        if (braceDepth > 0) {
          braceDepth -= 1;
        }
      } else if (
        char === "." &&
        parenDepth === 0 &&
        bracketDepth === 0 &&
        braceDepth === 0
      ) {
        return new Success(undefined);
      }

      this.consumeChar();
    }

    return new Failure(
      `Expected '.' after type annotation at position ${this.index}`,
    );
  }

  private readIdentifier(): string | null {
    if (this.isAtEnd()) {
      return null;
    }

    const start = this.index;
    const first = this.currentChar();
    if (!isIdentifierStartChar(first)) {
      return null;
    }

    this.consumeChar();
    while (!this.isAtEnd() && isIdentifierPartChar(this.currentChar())) {
      this.consumeChar();
    }

    return this.input.slice(start, this.index);
  }

  private canStartAtom(): boolean {
    const char = this.currentChar();
    if (char === "(") {
      return true;
    }

    return isIdentifierStartChar(char);
  }

  private skipWhitespace(): void {
    while (!this.isAtEnd() && /\s/.test(this.currentChar() ?? "")) {
      this.consumeChar();
    }
  }

  private currentChar(): string | undefined {
    return this.input[this.index];
  }

  private consumeChar(): void {
    this.index += 1;
  }

  private isAtEnd(): boolean {
    return this.index >= this.input.length;
  }
}

function isIdentifierStartChar(char: string | undefined): boolean {
  if (char === undefined) {
    return false;
  }

  return /[A-Za-z0-9_]/.test(char) || char === "\u{00B7}";
}

function isIdentifierPartChar(char: string | undefined): boolean {
  if (char === undefined) {
    return false;
  }

  return /[A-Za-z0-9_']/.test(char) || char === "\u{00B7}";
}
