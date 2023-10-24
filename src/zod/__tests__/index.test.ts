import * as assert from "node:assert/strict";

import { describe, it } from "vitest";
import { z, ZodError } from "zod";

import {
  parse,
  parseStringMinMax,
  parseStringMinMaxInteger,
  parseStringMs,
} from "../index.js";

describe("parse()", () => {
  describe("given a schema and a input matching the schema", () => {
    describe("when called", () => {
      const result = parse(z.string(), "foobar");

      it("returns a success", () => {
        assert.equal(result.isOk(), true);

        if (!result.isOk()) {
          assert.fail();
        }

        assert.equal(result.value, "foobar");
      });
    });
  });

  describe("given a schema and a input not matching the schema", () => {
    describe("when called", () => {
      const result = parse(z.string(), 123);

      it("returns an error", () => {
        assert.equal(result.isErr(), true);

        if (!result.isErr()) {
          assert.fail();
        }

        assert.equal(result.error instanceof ZodError, true);
      });
    });
  });
});

describe("parseStringMinMax()", () => {
  describe.each(["100", "50.2", "0", "-50.2", "-100"])(
    "given a valid ms value",
    (input) => {
      describe("when called", () => {
        const result = parseStringMinMax(input, { min: -100, max: 100 });

        it("returns an option containing a value", () => {
          assert.equal(result.isSome(), true);

          if (!result.isSome()) {
            assert.fail();
          }

          assert.equal(typeof result.value, "number");
        });
      });
    }
  );

  describe.each(["foobar", "-200", "-100.01", "100.01", "200"])(
    "given an invalid ms value",
    (input) => {
      describe("when called", () => {
        const result = parseStringMinMax(input, { min: -100, max: 100 });

        it("returns an option containing a value", () => {
          assert.equal(result.isNone(), true);

          if (!result.isNone()) {
            assert.fail();
          }
        });
      });
    }
  );
});

describe("parseStringMinMaxInteger()", () => {
  describe.each(["100", "0", "-100"])("given a valid ms value", (input) => {
    describe("when called", () => {
      const result = parseStringMinMaxInteger(input, { min: -100, max: 100 });

      it("returns an option containing a value", () => {
        assert.equal(result.isSome(), true);

        if (!result.isSome()) {
          assert.fail();
        }

        assert.equal(typeof result.value, "number");
      });
    });
  });

  describe.each(["foobar", "-200", "-100.01", "100.01", "200"])(
    "given an invalid ms value",
    (input) => {
      describe("when called", () => {
        const result = parseStringMinMaxInteger(input, { min: -100, max: 100 });

        it("returns an option containing a value", () => {
          assert.equal(result.isNone(), true);

          if (!result.isNone()) {
            assert.fail();
          }
        });
      });
    }
  );
});

describe("parseStringMs()", () => {
  describe.each([
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
  ])("given a valid ms value", (input) => {
    describe("when called", () => {
      const result = parseStringMs(input);

      it("returns an option containing a value", () => {
        assert.equal(result.isSome(), true);

        if (!result.isSome()) {
          assert.fail();
        }

        assert.equal(typeof result.value, "number");
      });
    });
  });

  describe.each(["foobar"])("given an invalid ms value", (input) => {
    describe("when called", () => {
      const result = parseStringMs(input);

      it("returns an option containing a value", () => {
        assert.equal(result.isNone(), true);

        if (!result.isNone()) {
          assert.fail();
        }
      });
    });
  });
});
