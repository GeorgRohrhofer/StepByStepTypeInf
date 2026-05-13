// Shared / Utils layer.
//
// `Result<T, E>` plus its constructors are pure, framework-agnostic helpers
// that every feature service can depend on. They have no React knowledge,
// no domain knowledge, and no side effects, so they live under
// `shared/utils/` (the spec's bucket for "pure helper functions") rather
// than inside any feature.

export type Result<T, E> = Success<T> | Failure<E>;

export class Success<T> {
  readonly isSuccess = true;
  readonly isFailure = false;

  public readonly value: T;

  constructor(value: T) {
    this.value = value;
  }
}

export class Failure<E> {
  readonly isSuccess = false;
  readonly isFailure = true;

  public readonly error: E;

  constructor(error: E) {
    this.error = error;
  }
}
