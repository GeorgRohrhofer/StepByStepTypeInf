export type Type =
    | { kind: 'var', name: string }
    | { kind: 'fun', from: Type, to: Type };

export type Term =
    | { kind: 'var', name: string }
    | { kind: 'abs', param: string, paramType?: Type, body: Term }
    | { kind: 'app', func: Term, arg: Term };
