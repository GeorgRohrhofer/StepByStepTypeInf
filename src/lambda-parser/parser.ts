import { Failure, Success, type Result } from "../shared/errors";
import type { Term } from "../shared/types";
export { getTerm } from "./formatter";

export function parseTerm(input: string): Result<Term, string> {
    const parser = new Parser(input);
    return parser.parse();
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
            return new Failure(`Unexpected token '${this.currentChar()}' at position ${this.index}`);
        }

        return parsed;
    }

    private parseExpression(): Result<Term, string> {
        this.skipWhitespace();
        if (this.currentChar() === "\\") {
            return this.parseAbstraction();
        }
        return this.parseApplication();
    }

    private parseAbstraction(): Result<Term, string> {
        this.consumeChar();
        this.skipWhitespace();

        const param = this.readIdentifier();
        if (param === null) {
            return new Failure(`Expected parameter name at position ${this.index}`);
        }

        this.skipWhitespace();
        if (this.currentChar() === ":") {
            this.consumeChar();
            const typeAnnotation = this.skipTypeAnnotation();
            if (typeAnnotation.isFailure) {
                return typeAnnotation;
            }
            this.skipWhitespace();
        }

        if (this.currentChar() !== ".") {
            return new Failure(`Expected '.' after parameter '${param}' at position ${this.index}`);
        }

        this.consumeChar();
        this.skipWhitespace();

        if (this.isAtEnd()) {
            return new Failure(`Expected abstraction body after position ${this.index}`);
        }

        const body = this.parseExpression();
        if (body.isFailure) {
            return body;
        }

        return new Success({ kind: "abs", param, body: body.value });
    }

    private parseApplication(): Result<Term, string> {
        const first = this.parseAtom();
        if (first.isFailure) {
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
            if (next.isFailure) {
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
            } else if (char === "." && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
                return new Success(undefined);
            }

            this.consumeChar();
        }

        return new Failure(`Expected '.' after type annotation at position ${this.index}`);
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

    return /[A-Za-z0-9_]/.test(char);
}

function isIdentifierPartChar(char: string | undefined): boolean {
    if (char === undefined) {
        return false;
    }

    return /[A-Za-z0-9_']/.test(char);
}
