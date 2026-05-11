import { Failure, Success, type Result } from "../shared/errors";
import type { Term } from "../shared/types";

var typeCounter = 0;

export function resetTypeNameCounter(): void {
    typeCounter = 0;
}

export function replaceParamWithType(term: Term): Result<Term, string> {
    return replaceParamWithTypeInScope(term, new Map<string, string>());
}

function replaceParamWithTypeInScope(
    term: Term,
    scope: Map<string, string>,
): Result<Term, string> {
    if (term.kind === "var") {
        const replacement = scope.get(term.name);
        return new Success({
            kind: "var",
            name: replacement ?? term.name,
        });
    }

    if (term.kind === "app") {
        const funcResult = replaceParamWithTypeInScope(term.func, scope);
        if (!funcResult.isSuccess) {
            return funcResult;
        }

        const argResult = replaceParamWithTypeInScope(term.arg, scope);
        if (!argResult.isSuccess) {
            return argResult;
        }

        return new Success({
            kind: "app",
            func: funcResult.value,
            arg: argResult.value,
        });
    }

    if (term.kind === "abs") {
        const typeName = getTypeName();
        const nextScope = new Map(scope);
        nextScope.set(term.param, typeName);

        const bodyResult = replaceParamWithTypeInScope(term.body, nextScope);
        if (!bodyResult.isSuccess) {
            return bodyResult;
        }

        return new Success({
            kind: "abs",
            param: typeName,
            paramType: term.paramType,
            body: bodyResult.value,
        });
    }

    return new Failure("Not implemented");
}

export function getTypeName(): string {
    return "t" + typeCounter++;
}
