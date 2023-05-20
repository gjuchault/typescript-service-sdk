import { err, ok, Result } from "neverthrow";

export type Option<T> = Some<T> | None;

export function some<T>(value: T): Some<T> {
  return new Some(value);
}

export function none(): None {
  return new None();
}

interface IOption<T> {
  /**
   * Used to check if an `Option` is a `Some`
   *
   * @returns `true` if the option is a `Some` variant of Option
   */
  isSome(): this is Some<T>;

  /**
   * Used to check if an `Option` is a `None`
   *
   * @returns `true` if the option is a `None` variant of Option
   */
  isNone(): this is None;

  /**
   * Maps a `Option<T>` to `Option<U>`
   * by applying a function to a contained `Some` value, leaving a `None` value
   * untouched.
   *
   * @param f The function to apply a `Some` value
   * @returns the result of applying `f` or a `None` untouched
   */
  map<U>(mapper: (t: T) => U): Option<U>;

  /**
   * **This method is unsafe, and should only be used in a test environments**
   *
   * Takes an `Option<T>` and returns a `T` when the result is an `Some`,
   * otherwise it throws a custom object.
   */
  _unsafeUnwrap(): T;

  /**
   * Used to extract the value out of a `Some`, returning a fallback when the
   * result is a `None`
   *
   * @param fallback The fallback to return when the result is a `None`
   */
  unwrapOr<U>(fallback: U): T | U;

  /**
   * Similar to `map` Except you must return a new `Option`.
   *
   * This is useful for when you need to do a subsequent computation using the
   * inner `T` value, but that computation might fail.
   *
   * @param f The function to apply to the current value
   */
  andThen<U>(mapper: (value: T) => Option<U>): Option<U>;

  /**
   * Used to create a neverthrow `Result` from an `Option`. `Some` will match
   * `Ok` and `None` will match `Error`
   *
   * @param error The error to apply when the `Option` is a `None`
   */
  toResult<E>(error: E): Result<T, E>;

  /**
   * Used to get a stringified representation of the `Option`.
   * `Some` will render as `Some({value})`, {value} being replaced by the
   * stringified value
   * `None` will render as `None`
   */
  toString(): string;
}

export class Some<T> implements IOption<T> {
  constructor(readonly value: T) {}

  isSome(): this is Some<T> {
    return true;
  }

  isNone(): this is None {
    return false;
  }

  map<U>(mapper: (t: T) => U) {
    return some(mapper(this.value));
  }

  _unsafeUnwrap(): T {
    return this.value;
  }

  unwrapOr<U>(): T | U {
    return this.value;
  }

  andThen<U>(f: (value: T) => Option<U>): Option<U> {
    return f(this.value);
  }

  toResult<E>(): Result<T, E> {
    return ok(this.value);
  }

  toString() {
    return `Some(${String(this.value)})`;
  }
}

export class None implements IOption<never> {
  isSome(): this is Some<never> {
    return false;
  }

  isNone(): this is None {
    return true;
  }

  map<U>(): Option<U> {
    return none();
  }

  _unsafeUnwrap(): never {
    throw new TypeError("Unwrapping None.");
  }

  unwrapOr<U>(fallback: U): U {
    return fallback;
  }

  andThen<U>(): Option<U> {
    return none();
  }

  toResult<E>(error: E) {
    return err(error);
  }

  toString() {
    return "None";
  }
}
