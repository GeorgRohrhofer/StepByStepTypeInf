import { Failure, Success, type Result } from "../shared/errors";
import type { Term, Type } from "../shared/types";

export function infereType(term: Term): Result<Type, string> {
    if (term.kind === "abs") {
        const result = infereType(term.body)

        if (result.isFailure)
            return result;

        return new Success({kind: "fun", from: {kind: "var", name: term.param}, to: result.value});
    }
    else if (term.kind === "var") {
        return new Success({kind: "var", name: term.name});
    }

    return new Failure("Type inference not implemented yet"); 
}

export function betaReduce(term: Term): Result<Term, string> {
    if (term.kind != "app")
        return new Failure("Term is not an application");

    if (term.func.kind != "abs")
        return new Failure("Function is not an abstraction");
    
    return new Failure("Not implemented");
}

