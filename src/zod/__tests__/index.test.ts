import * as assert from "node:assert/strict";
import { describe, it } from "node:test";

import { z, ZodError } from "zod";

import { isNone, isSome } from "../../option.js";
import {
  parse,
  parseStringMinMax,
  parseStringMinMaxInteger,
  parseStringMs,
} from "../index.js";

await describe("parse()", async () => {
  await describe("given a schema and a input matching the schema", async () => {
    await describe("when called", async () => {
      const result = parse(z.string(), "foobar");

      await it("returns a success", () => {
        assert.equal(result.isOk(), true);

        if (!result.isOk()) {
          assert.fail();
        }

        assert.equal(result.value, "foobar");
      });
    });
  });

  await describe("given a schema and a input not matching the schema", async () => {
    await describe("when called", async () => {
      const result = parse(z.string(), 123);

      await it("returns an error", () => {
        assert.equal(result.isErr(), true);

        if (!result.isErr()) {
          assert.fail();
        }

        assert.equal(result.error instanceof ZodError, true);
      });
    });
  });
});

await describe("parseStringMinMax()", async () => {
  await describe("given a valid ms value", async () => {
    const validMsValues = ["100", "50.2", "0", "-50.2", "-100"];

    await describe("when called", async () => {
      await it("returns an option containing a value", () => {
        for (const input of validMsValues) {
          const result = parseStringMinMax(input, { min: -100, max: 100 });

          assert.equal(isSome(result), true);

          if (!isSome(result)) {
            assert.fail();
          }

          assert.equal(typeof result.data, "number");
        }
      });
    });
  });

  await describe("given an invalid ms value", async () => {
    const invalidMsValues = ["foobar", "-200", "-100.01", "100.01", "200"];

    await describe("when called", async () => {
      await it("returns an option containing a value", () => {
        for (const input of invalidMsValues) {
          const result = parseStringMinMax(input, { min: -100, max: 100 });
          assert.equal(isNone(result), true);

          if (!isNone(result)) {
            assert.fail();
          }
        }
      });
    });
  });
});

await describe("parseStringMinMaxInteger()", async () => {
  await describe("given a valid ms value", async () => {
    const validMsValues = ["100", "0", "-100"];

    await describe("when called", async () => {
      await it("returns an option containing a value", () => {
        for (const input of validMsValues) {
          const result = parseStringMinMaxInteger(input, {
            min: -100,
            max: 100,
          });
          assert.equal(isSome(result), true);

          if (!isSome(result)) {
            assert.fail();
          }

          assert.equal(typeof result.data, "number");
        }
      });
    });
  });

  await describe("given an invalid ms value", async () => {
    const invalidMsValues = ["foobar", "-200", "-100.01", "100.01", "200"];

    await describe("when called", async () => {
      await it("returns an option containing a value", () => {
        for (const input of invalidMsValues) {
          const result = parseStringMinMaxInteger(input, {
            min: -100,
            max: 100,
          });
          assert.equal(isNone(result), true);

          if (!isNone(result)) {
            assert.fail();
          }
        }
      });
    });
  });
});

await describe("parseStringMs()", async () => {
  await describe("given a valid ms value", async () => {
    const validMsValues = [
      "2 days",
      "1d",
      "10h",
      "2.5 hrs",
      "2h",
      "1m",
      "5s",
      "1y",
      "100",
      "-3 days",
      "-1h",
      "-200",
    ];

    await describe("when called", async () => {
      await it("returns an option containing a value", () => {
        for (const input of validMsValues) {
          const result = parseStringMs(input);
          assert.equal(isSome(result), true);

          if (!isSome(result)) {
            assert.fail();
          }

          assert.equal(typeof result.data, "number");
        }
      });
    });
  });

  await describe("given an invalid ms value", async () => {
    const invalidMsValues = ["foobar"];

    await describe("when called", async () => {
      await it("returns an option containing a value", () => {
        for (const input of invalidMsValues) {
          const result = parseStringMs(input);
          assert.equal(isNone(result), true);

          if (!isNone(result)) {
            assert.fail();
          }
        }
      });
    });
  });
});
