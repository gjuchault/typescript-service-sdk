import ms from "ms";
import { err, ok, Result } from "neverthrow";
import { z, type ZodError, type ZodType, type ZodTypeDef } from "zod";

import { none, Option, some } from "../option";

/**
 * validates an input against a zod schema and return a result from it
 * @param schema zod schema
 * @param input input
 */
export function parse<TOutput, TInput>(
  schema: ZodType<TOutput, ZodTypeDef, TInput>,
  input: unknown
): Result<TOutput, ZodError<TInput>> {
  const zodResult = schema.safeParse(input);

  return zodResult.success ? ok(zodResult.data) : err(zodResult.error);
}

export function zodStringifiedNumber({
  integer,
  min,
  max,
}: {
  integer: boolean;
  min: number;
  max: number;
}) {
  return z
    .string()
    .refine((valueAsString) =>
      (integer
        ? parseStringMinMaxInteger(valueAsString, { min, max })
        : parseStringMinMax(valueAsString, { min, max })
      ).isSome()
    )
    .transform((valueAsString) =>
      (integer
        ? parseStringMinMaxInteger(valueAsString, { min, max })
        : parseStringMinMax(valueAsString, { min, max })
      )._unsafeUnwrap()
    );
}

export function zodStringifiedMs() {
  return z
    .string()
    .refine((valueAsString) => parseStringMs(valueAsString).isSome())
    .transform((valueAsString) => parseStringMs(valueAsString)._unsafeUnwrap());
}

/**
 * validates a string to ensure it is a `ms` compatible value
 * @param valueAsString input
 * @returns an option with the numeric value if the input is valid
 */
export function parseStringMs(valueAsString: string): Option<number> {
  try {
    const value = ms(valueAsString);

    if (Number.isSafeInteger(value)) {
      return some(value);
    }

    return none();
  } catch {
    return none();
  }
}

/**
 * validates a string to ensure it is an integer within a range
 * @param valueAsString input
 * @param range inclusive ranges to limit the value.
 * @returns an option with the numeric value if the input is valid
 */
export function parseStringMinMaxInteger(
  valueAsString: string,
  range: { min: number; max: number }
): Option<number> {
  const value = Number(valueAsString);

  if (Number.isSafeInteger(value) && value >= range.min && value <= range.max) {
    return some(value);
  }

  return none();
}

/**
 * validates a string to ensure it is a number within a range
 * @param valueAsString input
 * @param range inclusive ranges to limit the value.
 * @returns an option with the numeric value if the input is valid
 */
export function parseStringMinMax(
  valueAsString: string,
  range: { min: number; max: number }
): Option<number> {
  const value = Number(valueAsString);

  if (Number.isFinite(value) && value >= range.min && value <= range.max) {
    return some(value);
  }

  return none();
}
