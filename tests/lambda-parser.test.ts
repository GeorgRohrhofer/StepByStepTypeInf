import { composeCombinatorTerm, getTerm, parseTerm } from "../src/lambda-parser/parser";

type Case = { name: string; run: () => void };

const cases: Case[] = [
    {
        name: "parses a variable",
        run: () => {
            const result = parseTerm("x");
            assert(result.isSuccess, "expected parse success");
            if (result.isSuccess) {
                assertDeepEqual(result.value, { kind: "var", name: "x" });
            }
        },
    },
    {
        name: "parses multi-parameter abstraction as nested abstractions",
        run: () => {
            const result = parseTerm("\\x y.z");
            assert(result.isSuccess, "expected parse success");
            if (result.isSuccess) {
                assertDeepEqual(result.value, {
                    kind: "abs",
                    param: "x",
                    body: {
                        kind: "abs",
                        param: "y",
                        body: { kind: "var", name: "z" },
                    },
                });
            }
        },
    },
    {
        name: "parses bullet as composition combinator (•)",
        run: () => {
            const result = parseTerm("(•)");
            assert(result.isSuccess, "expected parse success");
            if (result.isSuccess) {
                assertDeepEqual(result.value, composeCombinatorTerm());
            }
        },
    },
    {
        name: "parses infix composition f • g as λx.f (g x)",
        run: () => {
            const result = parseTerm("f • g");
            assert(result.isSuccess, "expected parse success");
            if (result.isSuccess) {
                assertDeepEqual(result.value, {
                    kind: "abs",
                    param: "x",
                    body: {
                        kind: "app",
                        func: { kind: "var", name: "f" },
                        arg: {
                            kind: "app",
                            func: { kind: "var", name: "g" },
                            arg: { kind: "var", name: "x" },
                        },
                    },
                });
            }
        },
    },
    {
        name: "parses an abstraction",
        run: () => {
            const result = parseTerm("\\x.x");
            assert(result.isSuccess, "expected parse success");
            if (result.isSuccess) {
                assertDeepEqual(result.value, {
                    kind: "abs",
                    param: "x",
                    body: { kind: "var", name: "x" },
                });
            }
        },
    },
    {
        name: "parses a simple application",
        run: () => {
            const result = parseTerm("x y");
            assert(result.isSuccess, "expected parse success");
            if (result.isSuccess) {
                assertDeepEqual(result.value, {
                    kind: "app",
                    func: { kind: "var", name: "x" },
                    arg: { kind: "var", name: "y" },
                });
            }
        },
    },
    {
        name: "parses left-associative applications",
        run: () => {
            const result = parseTerm("x y z");
            assert(result.isSuccess, "expected parse success");
            if (result.isSuccess) {
                assertDeepEqual(result.value, {
                    kind: "app",
                    func: {
                        kind: "app",
                        func: { kind: "var", name: "x" },
                        arg: { kind: "var", name: "y" },
                    },
                    arg: { kind: "var", name: "z" },
                });
            }
        },
    },
    {
        name: "respects parentheses in applications",
        run: () => {
            const result = parseTerm("(\\x.x) 4");
            assert(result.isSuccess, "expected parse success");
            if (result.isSuccess) {
                assertDeepEqual(result.value, {
                    kind: "app",
                    func: {
                        kind: "abs",
                        param: "x",
                        body: { kind: "var", name: "x" },
                    },
                    arg: { kind: "var", name: "4" },
                });
            }
        },
    },
    {
        name: "parses nested grouped terms",
        run: () => {
            const result = parseTerm("x (y z)");
            assert(result.isSuccess, "expected parse success");
            if (result.isSuccess) {
                assertDeepEqual(result.value, {
                    kind: "app",
                    func: { kind: "var", name: "x" },
                    arg: {
                        kind: "app",
                        func: { kind: "var", name: "y" },
                        arg: { kind: "var", name: "z" },
                    },
                });
            }
        },
    },
    {
        name: "parses abstraction body as full expression",
        run: () => {
            const result = parseTerm("\\x.x y");
            assert(result.isSuccess, "expected parse success");
            if (result.isSuccess) {
                assertDeepEqual(result.value, {
                    kind: "abs",
                    param: "x",
                    body: {
                        kind: "app",
                        func: { kind: "var", name: "x" },
                        arg: { kind: "var", name: "y" },
                    },
                });
            }
        },
    },
    {
        name: "accepts optional type annotations",
        run: () => {
            const result = parseTerm("\\x:T.x");
            assert(result.isSuccess, "expected parse success");
            if (result.isSuccess) {
                assertDeepEqual(result.value, {
                    kind: "abs",
                    param: "x",
                    body: { kind: "var", name: "x" },
                });
            }
        },
    },
    {
        name: "skips nested type annotations until top-level dot",
        run: () => {
            const result = parseTerm("\\x:(A.(B[C]{D})).x");
            assert(result.isSuccess, "expected parse success");
            if (result.isSuccess) {
                assertDeepEqual(result.value, {
                    kind: "abs",
                    param: "x",
                    body: { kind: "var", name: "x" },
                });
            }
        },
    },
    {
        name: "allows apostrophes in identifier tail",
        run: () => {
            const result = parseTerm("x'1");
            assert(result.isSuccess, "expected parse success");
            if (result.isSuccess) {
                assertDeepEqual(result.value, { kind: "var", name: "x'1" });
            }
        },
    },
    {
        name: "fails on empty input",
        run: () => {
            const result = parseTerm("   ");
            assert(result.isFailure, "expected parse failure");
            if (result.isFailure) {
                assert(result.error === "Input is empty", "unexpected error message");
            }
        },
    },
    {
        name: "fails on missing dot in abstraction",
        run: () => {
            const result = parseTerm("\\x x");
            assert(result.isFailure, "expected parse failure");
            if (result.isFailure) {
                assert(result.error.includes("Expected '.'"), "missing expected failure detail");
            }
        },
    },
    {
        name: "fails on missing abstraction body",
        run: () => {
            const result = parseTerm("\\x.");
            assert(result.isFailure, "expected parse failure");
            if (result.isFailure) {
                assert(result.error.includes("Expected abstraction body"), "missing expected failure detail");
            }
        },
    },
    {
        name: "fails on unmatched opening parenthesis",
        run: () => {
            const result = parseTerm("(x y");
            assert(result.isFailure, "expected parse failure");
            if (result.isFailure) {
                assert(result.error.includes("Expected ')'"), "missing expected failure detail");
            }
        },
    },
    {
        name: "fails on unexpected trailing token",
        run: () => {
            const result = parseTerm("x )");
            assert(result.isFailure, "expected parse failure");
            if (result.isFailure) {
                assert(result.error.includes("Unexpected token"), "missing expected failure detail");
            }
        },
    },
    {
        name: "prints terms with necessary parentheses",
        run: () => {
            const parsed = parseTerm("(\\x.x) (y z)");
            assert(parsed.isSuccess, "expected parse success");
            if (parsed.isSuccess) {
                assert(getTerm(parsed.value) === "(\\x.x) (y z)", "pretty-printer output mismatch");
            }
        },
    },
];

let passed = 0;
for (const testCase of cases) {
    try {
        testCase.run();
        passed += 1;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`${testCase.name}: ${message}`);
    }
}

console.log(`lambda-parser tests: ${passed}/${cases.length} passed`);

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(message);
    }
}

function assertDeepEqual(actual: unknown, expected: unknown): void {
    const actualJson = JSON.stringify(actual);
    const expectedJson = JSON.stringify(expected);
    if (actualJson !== expectedJson) {
        throw new Error(`expected ${expectedJson} but got ${actualJson}`);
    }
}
