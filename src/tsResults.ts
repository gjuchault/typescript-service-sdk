import * as tsResults from "ts-results";

export type { Option, Result } from "ts-results";

export function some<T>(value: T): tsResults.Some<T> {
  return new tsResults.Some(value);
}

export const none = tsResults.None;

export function ok<T>(value: T): tsResults.Ok<T> {
  return new tsResults.Ok(value);
}

export function err<T>(value: T): tsResults.Err<T> {
  return new tsResults.Err(value);
}
