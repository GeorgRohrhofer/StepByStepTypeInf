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
