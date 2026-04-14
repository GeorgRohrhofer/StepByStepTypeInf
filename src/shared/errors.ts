export type Result<T, E> = Success<T> | Failure<E>;

export class Success<T> {
    readonly isSuccess: true = true;
    readonly isFailure: false = false;

    public readonly value: T;

    constructor(value: T) { 
        this.value = value;
    }

}

export class Failure<E> {
    readonly isSuccess: false = false;
    readonly isFailure: true = true;

    public readonly error: E;
 
    constructor(error: E) { 
        this.error = error;
    }
}
