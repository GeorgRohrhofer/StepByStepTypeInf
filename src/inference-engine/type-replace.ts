import { Failure, Success, type Result } from "../shared/errors";
import type { Term } from "../shared/types";

var typeCounter = 0;

export function replaceParamWithType(term: Term): Result<Term, string> {
    if (term.kind === "abs") {
        const result = replaceParamWithType(term.body);
        
        if (result.isFailure)
            return result;

        var bodyResult = result.value;
        const typeName = getTypeName();
        term.param = typeName;

        while (bodyResult.kind === "abs") {
            if (bodyResult.param === term.param) {
                bodyResult.param = typeName;
            }

            bodyResult = bodyResult.body;
        }

        return new Success(term);
    }

    if (term.kind == "var") {
        return new Success(term);
    }

    return new Failure("Not implemented for" + term.kind);
}

export function getTypeName(): string {
    return "t" + typeCounter++;
}
