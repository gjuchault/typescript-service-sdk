import assert from "node:assert/strict";
import { describe, it } from "node:test";

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
} from "../number.js";

const mandatoryListOfNumbers = new Set([
  0,
  3.14,
  -3.14,
  -7,
  7,
  0.5,
  -0.5,
  9007199254740992,
  -9007199254740992,
  Number.POSITIVE_INFINITY,
  Number.NEGATIVE_INFINITY,
  Number.NaN,
]);

function testNumberMap(
  name: string,
  schema: Zod.ZodSchema,
  map: Record<number, boolean>,
) {
  const mapKeys = new Set(Object.keys(map));

  for (const mapKey of mapKeys) {
    if (!mandatoryListOfNumbers.has(Number(mapKey))) {
      throw new Error(`Unexpected map key: ${mapKey}`);
    }
  }

  for (const mandatoryKey of mandatoryListOfNumbers) {
    if (!mapKeys.has(String(mandatoryKey))) {
      throw new Error(`Missing map key: ${mandatoryKey}`);
    }
  }

  for (const [num, shouldPass] of Object.entries(map)) {
    const result = schema.safeParse(Number(num));

    assert.equal(
      result.success,
      shouldPass,
      `Testing ${num} against ${name}, result: ${result.success}, expected: ${shouldPass}`,
    );
  }
}

await describe("finiteSchema", async () => {
  await describe("given some numbers", async () => {
    const map = {
      [0]: true,
      [3.14]: true,
      [-3.14]: true,
      [-7]: true,
      [7]: true,
      [0.5]: true,
      [-0.5]: true,
      [9007199254740992]: true,
      [-9007199254740992]: true,
      [Number.POSITIVE_INFINITY]: false,
      [Number.NEGATIVE_INFINITY]: false,
      [Number.NaN]: false,
    };

    await describe("when called", async () => {
      await it("returns the expected value", () => {
        testNumberMap("finiteSchema", finiteSchema, map);
      });
    });
  });
});

await describe("negativeSafeIntegerSchema", async () => {
  await describe("given some numbers", async () => {
    const map = {
      [0]: false,
      [3.14]: false,
      [-3.14]: false,
      [-7]: true,
      [7]: false,
      [0.5]: false,
      [-0.5]: false,
      [9007199254740992]: false,
      [-9007199254740992]: false,
      [Number.POSITIVE_INFINITY]: false,
      [Number.NEGATIVE_INFINITY]: false,
      [Number.NaN]: false,
    };

    await describe("when called", async () => {
      await it("returns the expected value", () => {
        testNumberMap(
          "negativeSafeIntegerSchema",
          negativeSafeIntegerSchema,
          map,
        );
      });
    });
  });
});

await describe("negativeSchema", async () => {
  await describe("given some numbers", async () => {
    const map = {
      [0]: false,
      [3.14]: false,
      [-3.14]: true,
      [-7]: true,
      [7]: false,
      [0.5]: false,
      [-0.5]: true,
      [9007199254740992]: false,
      [-9007199254740992]: true,
      [Number.POSITIVE_INFINITY]: false,
      [Number.NEGATIVE_INFINITY]: true,
      [Number.NaN]: false,
    };

    await describe("when called", async () => {
      await it("returns the expected value", () => {
        testNumberMap("negativeSchema", negativeSchema, map);
      });
    });
  });
});

await describe("nonNegativeSafeIntegerSchema", async () => {
  await describe("given some numbers", async () => {
    const map = {
      [0]: true,
      [3.14]: false,
      [-3.14]: false,
      [-7]: false,
      [7]: true,
      [0.5]: false,
      [-0.5]: false,
      [9007199254740992]: false,
      [-9007199254740992]: false,
      [Number.POSITIVE_INFINITY]: false,
      [Number.NEGATIVE_INFINITY]: false,
      [Number.NaN]: false,
    };

    await describe("when called", async () => {
      await it("returns the expected value", () => {
        testNumberMap(
          "nonNegativeSafeIntegerSchema",
          nonNegativeSafeIntegerSchema,
          map,
        );
      });
    });
  });
});

await describe("nonNegativeSchema", async () => {
  await describe("given some numbers", async () => {
    const map = {
      [0]: true,
      [3.14]: true,
      [-3.14]: false,
      [-7]: false,
      [7]: true,
      [0.5]: true,
      [-0.5]: false,
      [9007199254740992]: true,
      [-9007199254740992]: false,
      [Number.POSITIVE_INFINITY]: true,
      [Number.NEGATIVE_INFINITY]: false,
      [Number.NaN]: false,
    };

    await describe("when called", async () => {
      await it("returns the expected value", () => {
        testNumberMap("nonNegativeSchema", nonNegativeSchema, map);
      });
    });
  });
});

await describe("nonPositiveSafeIntegerSchema", async () => {
  await describe("given some numbers", async () => {
    const map = {
      [0]: true,
      [3.14]: false,
      [-3.14]: false,
      [-7]: true,
      [7]: false,
      [0.5]: false,
      [-0.5]: false,
      [9007199254740992]: false,
      [-9007199254740992]: false,
      [Number.POSITIVE_INFINITY]: false,
      [Number.NEGATIVE_INFINITY]: false,
      [Number.NaN]: false,
    };

    await describe("when called", async () => {
      await it("returns the expected value", () => {
        testNumberMap(
          "nonPositiveSafeIntegerSchema",
          nonPositiveSafeIntegerSchema,
          map,
        );
      });
    });
  });
});

await describe("nonPositiveSchema", async () => {
  await describe("given some numbers", async () => {
    const map = {
      [0]: true,
      [3.14]: false,
      [-3.14]: true,
      [-7]: true,
      [7]: false,
      [0.5]: false,
      [-0.5]: true,
      [9007199254740992]: false,
      [-9007199254740992]: true,
      [Number.POSITIVE_INFINITY]: false,
      [Number.NEGATIVE_INFINITY]: true,
      [Number.NaN]: false,
    };

    await describe("when called", async () => {
      await it("returns the expected value", () => {
        testNumberMap("nonPositiveSchema", nonPositiveSchema, map);
      });
    });
  });
});

await describe("positiveSafeIntegerSchema", async () => {
  await describe("given some numbers", async () => {
    const map = {
      [0]: false,
      [3.14]: false,
      [-3.14]: false,
      [-7]: false,
      [7]: true,
      [0.5]: false,
      [-0.5]: false,
      [9007199254740992]: false,
      [-9007199254740992]: false,
      [Number.POSITIVE_INFINITY]: false,
      [Number.NEGATIVE_INFINITY]: false,
      [Number.NaN]: false,
    };

    await describe("when called", async () => {
      await it("returns the expected value", () => {
        testNumberMap(
          "positiveSafeIntegerSchema",
          positiveSafeIntegerSchema,
          map,
        );
      });
    });
  });
});

await describe("positiveSchema", async () => {
  await describe("given some numbers", async () => {
    const map = {
      [0]: false,
      [3.14]: true,
      [-3.14]: false,
      [-7]: false,
      [7]: true,
      [0.5]: true,
      [-0.5]: false,
      [9007199254740992]: true,
      [-9007199254740992]: false,
      [Number.POSITIVE_INFINITY]: true,
      [Number.NEGATIVE_INFINITY]: false,
      [Number.NaN]: false,
    };

    await describe("when called", async () => {
      await it("returns the expected value", () => {
        testNumberMap("positiveSchema", positiveSchema, map);
      });
    });
  });
});

await describe("safeIntegerSchema", async () => {
  await describe("given some numbers", async () => {
    const map = {
      [0]: true,
      [3.14]: false,
      [-3.14]: false,
      [-7]: true,
      [7]: true,
      [0.5]: false,
      [-0.5]: false,
      [9007199254740992]: false,
      [-9007199254740992]: false,
      [Number.POSITIVE_INFINITY]: false,
      [Number.NEGATIVE_INFINITY]: false,
      [Number.NaN]: false,
    };

    await describe("when called", async () => {
      await it("returns the expected value", () => {
        testNumberMap("safeIntegerSchema", safeIntegerSchema, map);
      });
    });
  });
});
