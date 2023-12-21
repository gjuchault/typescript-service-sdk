export type { ValidDate, ValidDateTime } from "./date-time.js";
import { validDateSchema, validDateTimeSchema } from "./date-time.js";
export type { NonEmptyArray } from "./non-empty-array.js";
import {
  concat,
  createNonEmptyArraySchema,
  filter,
  flat,
  flatMap,
  fromElements,
  isNonEmptyArray,
  makeNonEmptyArray,
  map,
  reverse,
  slice,
} from "./non-empty-array.js";
import {
  finiteSchema,
  negativeSafeIntegerSchema,
  negativeSchema,
  nonNegativeSafeIntegerSchema,
  nonNegativeSchema,
  nonPositiveSafeIntegerSchema,
  nonPositiveSchema,
  positiveSafeIntegerSchema,
  positiveSchema,
  safeIntegerSchema,
} from "./number.js";

export const dateTime = { validDateSchema, validDateTimeSchema };

export const nonEmptyArray = {
  concat,
  createNonEmptyArraySchema,
  filter,
  flat,
  flatMap,
  fromElements,
  isNonEmptyArray,
  makeNonEmptyArray,
  map,
  reverse,
  slice,
};

export const number = {
  finiteSchema,
  negativeSafeIntegerSchema,
  negativeSchema,
  nonNegativeSafeIntegerSchema,
  nonNegativeSchema,
  nonPositiveSafeIntegerSchema,
  nonPositiveSchema,
  positiveSafeIntegerSchema,
  positiveSchema,
  safeIntegerSchema,
};
