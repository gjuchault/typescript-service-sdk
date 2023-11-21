import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";

export type Some<T> = {
  kind: "some";
  data: T;
};

export type None = {
  kind: "none";
};

export type Option<T> = Some<T> | None;

export function some<T>(value: T): Some<T> {
  return { kind: "some", data: value };
}

export function none(): None {
  return { kind: "none" };
}

/**
 * Used to check if an `Option` is a `Some`
 *
 * @returns `true` if the option is a `Some` variant of Option
 */
export function isSome<T>(option: Option<T>): option is Some<T> {
  return option.kind === "some";
}

/**
 * Used to check if an `Option` is a `None`
 *
 * @returns `true` if the option is a `None` variant of Option
 */
export function isNone<T>(option: Option<T>): option is None {
  return option.kind === "none";
}

/**
 * Maps a `Option<T>` to `Option<U>`
 * by applying a function to a contained `Some` value, leaving a `None` value
 * untouched.
 *
 * @param f The function to apply a `Some` value
 * @returns the result of applying `f` or a `None` untouched
 */
export function map<T, U>(option: Option<T>, mapper: (t: T) => U): Option<U> {
  if (isSome(option)) {
    return some(mapper(option.data));
  }

  return none();
}

/**
 * **This method is unsafe, and should only be used in a test environments**
 *
 * Takes an `Option<T>` and returns a `T` when the result is an `Some`,
 * otherwise it throws a custom object.
 */
export function unsafeUnwrap<T>(option: Option<T>): T {
  if (isSome(option)) {
    return option.data;
  }

  throw new TypeError("Unwrapping None.");
}

/**
 * Used to extract the value out of a `Some`, returning a fallback when the
 * result is a `None`
 *
 * @param fallback The fallback to return when the result is a `None`
 */
export function unwrapOr<T, U>(option: Option<T>, fallback: U): T | U {
  if (isSome(option)) {
    return option.data;
  }

  return fallback;
}

/**
 * Similar to `map` Except you must return a new `Option`.
 *
 * This is useful for when you need to do a subsequent computation using the
 * inner `T` value, but that computation might fail.
 *
 * @param f The function to apply to the current value
 */
export function andThen<T, U>(
  option: Option<T>,
  mapper: (value: T) => Option<U>,
): Option<U> {
  if (isSome(option)) {
    return mapper(option.data);
  }

  return none();
}

/**
 * Used to create a neverthrow `Result` from an `Option`. `Some` will match
 * `Ok` and `None` will match `Error`
 *
 * @param error The error to apply when the `Option` is a `None`
 */
export function toResult<T, E>(option: Option<T>, error: E): Result<T, E> {
  if (isSome(option)) {
    return ok(option.data);
  }

  return err(error);
}

/**
 * Used to get a stringified representation of the `Option`.
 * `Some` will render as `Some({value})`, {value} being replaced by the
 * stringified value
 * `None` will render as `None`
 */
export function toString<T>(option: Option<T>): string {
  if (isSome(option)) {
    return `Some(${JSON.stringify(option.data)})`;
  }

  return "None";
}
