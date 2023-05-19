import { Err, None, Ok, Some } from "ts-results-es";

export type { Option, Result } from "ts-results-es";

export function some<T>(value: T): Some<T> {
  return new Some(value);
}

export const none = None;

export function ok<T>(value: T): Ok<T> {
  return new Ok(value);
}

export function err<T>(value: T): Err<T> {
  return new Err(value);
}
