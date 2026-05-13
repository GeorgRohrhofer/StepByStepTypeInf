// Service layer / inference submodule.
//
// Hindley–Milner-style W algorithm, β-reduction, and trace collection.
// Pure functions exposed to the pipeline; the only state involved is the
// internal substitution and meta-id counter, which are reset on each entry.
//
// NOTE (preserved smell, see AGENTS.md "Avoid Shared Module State for
// Request Data"): `inferSubst` and `inferMetaId` are module-scoped mutable
// state. They are reset at every public entry point, but concurrent
// invocations would still clash. Left as-is per the "do not change
// business logic" constraint of this refactor.

import { Failure, Success, type Result } from "../../../../shared/utils/result";
import type { Term, Type } from "../../types";

let inferSubst: Map<string, Type> = new Map();
let inferMetaId = 0;

function resetInferState(): void {
  inferSubst = new Map();
  inferMetaId = 0;
}

function freshMetaType(): Type {
  return { kind: "var", name: `t_${inferMetaId++}` };
}

function applySubstType(t: Type): Type {
  if (t.kind === "var") {
    const mapped = inferSubst.get(t.name);
    if (mapped) {
      return applySubstType(mapped);
    }

    return t;
  }

  return {
    kind: "fun",
    from: applySubstType(t.from),
    to: applySubstType(t.to),
  };
}

function occursInTypeVar(name: string, t: Type): boolean {
  const u = applySubstType(t);
  if (u.kind === "var") {
    if (u.name === name) {
      return true;
    }

    const mapped = inferSubst.get(u.name);
    return mapped ? occursInTypeVar(name, mapped) : false;
  }

  return occursInTypeVar(name, u.from) || occursInTypeVar(name, u.to);
}

export type InferenceTraceStep =
  | { kind: "environment"; bindings: { name: string; type: string }[] }
  | { kind: "var_lookup"; name: string; type: string }
  | {
      kind: "assume";
      param: string;
      type: string;
      source: "annotation" | "fresh";
    }
  | { kind: "abs_body_next"; param: string }
  | {
      kind: "app_subterms_typed";
      funcType: string;
      argType: string;
    }
  | {
      kind: "app_rule_constraint";
      funcType: string;
      argType: string;
      freshResult: string;
    }
  | { kind: "unify"; lhs: string; rhs: string }
  | { kind: "final"; type: string };

function unifyTypes(
  a: Type,
  b: Type,
  trace?: (step: InferenceTraceStep) => void,
): Result<void, string> {
  const aa = applySubstType(a);
  const bb = applySubstType(b);

  if (aa.kind === "var" && bb.kind === "var" && aa.name === bb.name) {
    return new Success(undefined);
  }

  if (aa.kind === "var") {
    if (occursInTypeVar(aa.name, bb)) {
      return new Failure("Occurs check failed (infinite type)");
    }

    inferSubst.set(aa.name, bb);
    trace?.({ kind: "unify", lhs: aa.name, rhs: formatInferredType(bb) });
    return new Success(undefined);
  }

  if (bb.kind === "var") {
    if (occursInTypeVar(bb.name, aa)) {
      return new Failure("Occurs check failed (infinite type)");
    }

    inferSubst.set(bb.name, aa);
    trace?.({ kind: "unify", lhs: bb.name, rhs: formatInferredType(aa) });
    return new Success(undefined);
  }

  if (aa.kind === "fun" && bb.kind === "fun") {
    const u1 = unifyTypes(aa.from, bb.from, trace);
    if (u1.isFailure) {
      return u1;
    }

    return unifyTypes(aa.to, bb.to, trace);
  }

  return new Failure(
    `Type mismatch: ${formatInferredType(aa)} vs ${formatInferredType(bb)}`,
  );
}

function formatInferredType(t: Type): string {
  const u = applySubstType(t);
  if (u.kind === "var") {
    return u.name;
  }

  return `(${formatInferredType(u.from)} -> ${formatInferredType(u.to)})`;
}

function inferW(
  term: Term,
  env: Map<string, Type>,
  trace?: (step: InferenceTraceStep) => void,
): Result<Type, string> {
  if (term.kind === "var") {
    const t = env.get(term.name);
    if (!t) {
      return new Failure(`Unbound variable '${term.name}'`);
    }

    trace?.({
      kind: "var_lookup",
      name: term.name,
      type: formatInferredType(t),
    });
    return new Success(t);
  }

  if (term.kind === "abs") {
    const dom = term.paramType ?? freshMetaType();
    trace?.({
      kind: "assume",
      param: term.param,
      type: formatInferredType(dom),
      source: term.paramType ? "annotation" : "fresh",
    });
    const env2 = new Map(env);
    env2.set(term.param, dom);
    trace?.({ kind: "abs_body_next", param: term.param });
    const bodyResult = inferW(term.body, env2, trace);
    if (bodyResult.isSuccess) {
      return new Success({
        kind: "fun",
        from: applySubstType(dom),
        to: bodyResult.value,
      });
    }

    return bodyResult;
  }

  const funcT = inferW(term.func, env, trace);
  if (!funcT.isSuccess) {
    return funcT;
  }

  const argT = inferW(term.arg, env, trace);
  if (!argT.isSuccess) {
    return argT;
  }

  const ret = freshMetaType();
  const freshResultName =
    ret.kind === "var" ? ret.name : formatInferredType(ret);
  const funcTyStr = formatInferredType(funcT.value);
  const argTyStr = formatInferredType(argT.value);
  trace?.({
    kind: "app_subterms_typed",
    funcType: funcTyStr,
    argType: argTyStr,
  });
  trace?.({
    kind: "app_rule_constraint",
    funcType: funcTyStr,
    argType: argTyStr,
    freshResult: freshResultName,
  });
  const u = unifyTypes(
    funcT.value,
    { kind: "fun", from: argT.value, to: ret },
    trace,
  );
  if (u.isFailure) {
    return new Failure(u.error);
  }

  return new Success(applySubstType(ret));
}

export function formatTypeString(t: Type): string {
  return formatInferredType(t);
}

export type InferenceTraceOutcome =
  | { outcome: "ok"; type: Type; steps: InferenceTraceStep[] }
  | { outcome: "error"; error: string; steps: InferenceTraceStep[] };

export function infereTypeWithTrace(term: Term): InferenceTraceOutcome {
  resetInferState();
  const steps: InferenceTraceStep[] = [];
  const trace = (s: InferenceTraceStep) => steps.push(s);

  const env = new Map<string, Type>();
  const bindings: { name: string; type: string }[] = [];
  for (const name of getFreeVariables(term)) {
    const t = freshMetaType();
    env.set(name, t);
    bindings.push({ name, type: formatInferredType(t) });
  }

  if (bindings.length > 0) {
    trace({ kind: "environment", bindings });
  }

  const inferred = inferW(term, env, trace);
  if (inferred instanceof Failure) {
    return { outcome: "error", error: inferred.error, steps };
  }

  const finalType = applySubstType(inferred.value);
  trace({ kind: "final", type: formatInferredType(finalType) });
  return { outcome: "ok", type: finalType, steps };
}

export function infereType(term: Term): Result<Type, string> {
  resetInferState();
  const env = new Map<string, Type>();
  for (const name of getFreeVariables(term)) {
    env.set(name, freshMetaType());
  }

  const inferred = inferW(term, env);
  if (inferred.isSuccess) {
    return new Success(applySubstType(inferred.value));
  }

  return inferred;
}

const noBetaRedexMessage =
  "No beta redex in term (need a subterm (\\x.M) N — e.g. (\\x.x) y, not (\\x.x) alone)";

/** One step of leftmost-outermost β-reduction (finds a redex inside applications and abstractions). */
export function betaReduce(term: Term): Result<Term, string> {
  const atRoot = tryContractRedex(term);
  if (atRoot !== null) {
    return new Success(atRoot);
  }

  if (term.kind === "app") {
    const left = betaReduce(term.func);
    if (left.isSuccess) {
      return new Success({ kind: "app", func: left.value, arg: term.arg });
    }

    const right = betaReduce(term.arg);
    if (right.isSuccess) {
      return new Success({ kind: "app", func: term.func, arg: right.value });
    }

    return new Failure(noBetaRedexMessage);
  }

  if (term.kind === "abs") {
    const inner = betaReduce(term.body);
    if (inner.isSuccess) {
      return new Success({
        kind: "abs",
        param: term.param,
        paramType: term.paramType,
        body: inner.value,
      });
    }

    return new Failure(noBetaRedexMessage);
  }

  return new Failure(noBetaRedexMessage);
}

/** Repeated single-step β-reduction until no redex remains (or one step fails). */
export function collectBetaReductionSteps(start: Term): {
  term: Term;
  steps: { from: Term; to: Term }[];
} {
  const steps: { from: Term; to: Term }[] = [];
  let current = start;
  while (true) {
    const next = betaReduce(current);
    if (!next.isSuccess) {
      break;
    }

    steps.push({ from: current, to: next.value });
    current = next.value;
  }

  return { term: current, steps };
}

function tryContractRedex(term: Term): Term | null {
  if (term.kind === "app" && term.func.kind === "abs") {
    return substitute(term.func.body, term.func.param, term.arg);
  }

  return null;
}

function substitute(term: Term, variable: string, replacement: Term): Term {
  if (term.kind === "var") {
    if (term.name === variable) {
      return replacement;
    }

    return term;
  }

  if (term.kind === "app") {
    return {
      kind: "app",
      func: substitute(term.func, variable, replacement),
      arg: substitute(term.arg, variable, replacement),
    };
  }

  if (term.param === variable) {
    return term;
  }

  const replacementFreeVars = getFreeVariables(replacement);
  if (replacementFreeVars.has(term.param)) {
    const freshParam = getFreshName(term, replacement, variable);
    const renamedBody = renameBoundVariable(term.body, term.param, freshParam);

    return {
      kind: "abs",
      param: freshParam,
      paramType: term.paramType,
      body: substitute(renamedBody, variable, replacement),
    };
  }

  return {
    kind: "abs",
    param: term.param,
    paramType: term.paramType,
    body: substitute(term.body, variable, replacement),
  };
}

function renameBoundVariable(term: Term, from: string, to: string): Term {
  if (term.kind === "var") {
    if (term.name === from) {
      return { kind: "var", name: to };
    }

    return term;
  }

  if (term.kind === "app") {
    return {
      kind: "app",
      func: renameBoundVariable(term.func, from, to),
      arg: renameBoundVariable(term.arg, from, to),
    };
  }

  if (term.param === from) {
    return term;
  }

  return {
    kind: "abs",
    param: term.param,
    paramType: term.paramType,
    body: renameBoundVariable(term.body, from, to),
  };
}

function getFreeVariables(
  term: Term,
  bound: Set<string> = new Set(),
): Set<string> {
  if (term.kind === "var") {
    if (bound.has(term.name)) {
      return new Set();
    }

    return new Set([term.name]);
  }

  if (term.kind === "app") {
    const freeInFunc = getFreeVariables(term.func, bound);
    const freeInArg = getFreeVariables(term.arg, bound);
    return new Set([...freeInFunc, ...freeInArg]);
  }

  const nextBound = new Set(bound);
  nextBound.add(term.param);
  return getFreeVariables(term.body, nextBound);
}

function getFreshName(body: Term, replacement: Term, variable: string): string {
  const reserved = new Set<string>([
    ...getFreeVariables(body),
    ...getFreeVariables(replacement),
    variable,
  ]);

  let index = 0;
  let candidate = `${variable}_${index}`;
  while (reserved.has(candidate)) {
    index += 1;
    candidate = `${variable}_${index}`;
  }

  return candidate;
}
