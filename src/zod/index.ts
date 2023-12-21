import ms from "ms";
import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";
import type { ZodError, ZodType, ZodTypeDef } from "zod";
import { z } from "zod";

import type { Option } from "../option.js";
import { isSome, none, some, unsafeUnwrap } from "../option.js";

/**
 * validates an input against a zod schema and return a result from it
 * @param schema - zod schema
 * @param input - input
 */
export function parse<TOutput, TInput>(
  schema: ZodType<TOutput, ZodTypeDef, TInput>,
  input: unknown,
): Result<TOutput, ZodError<TInput>> {
  const zodResult = schema.safeParse(input);

  return zodResult.success ? ok(zodResult.data) : err(zodResult.error);
}

export function stringifiedNumber({
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
      isSome(
        integer
          ? parseStringMinMaxInteger(valueAsString, { min, max })
          : parseStringMinMax(valueAsString, { min, max }),
      ),
    )
    .transform((valueAsString) =>
      unsafeUnwrap(
        integer
          ? parseStringMinMaxInteger(valueAsString, { min, max })
          : parseStringMinMax(valueAsString, { min, max }),
      ),
    );
}

export function stringifiedMs() {
  return z
    .string()
    .refine((valueAsString) => isSome(parseStringMs(valueAsString)))
    .transform((valueAsString) => unsafeUnwrap(parseStringMs(valueAsString)));
}

/**
 * validates a string to ensure it is a `ms` compatible value
 * @param valueAsString - input
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
 * @param valueAsString - input
 * @param range - inclusive ranges to limit the value.
 * @returns an option with the numeric value if the input is valid
 */
export function parseStringMinMaxInteger(
  valueAsString: string,
  range: { min: number; max: number },
): Option<number> {
  const value = Number(valueAsString);

  if (Number.isSafeInteger(value) && value >= range.min && value <= range.max) {
    return some(value);
  }

  return none();
}

/**
 * validates a string to ensure it is a number within a range
 * @param valueAsString - input
 * @param range - inclusive ranges to limit the value.
 * @returns an option with the numeric value if the input is valid
 */
export function parseStringMinMax(
  valueAsString: string,
  range: { min: number; max: number },
): Option<number> {
  const value = Number(valueAsString);

  if (Number.isFinite(value) && value >= range.min && value <= range.max) {
    return some(value);
  }

  return none();
}
