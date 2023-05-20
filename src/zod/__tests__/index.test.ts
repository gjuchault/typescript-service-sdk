import { describe, expect, it } from "vitest";
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
        expect(result.isOk()).toBe(true);

        if (!result.isOk()) {
          expect.fail();
        }

        expect(result.value).toBe("foobar");
      });
    });
  });

  describe("given a schema and a input not matching the schema", () => {
    describe("when called", () => {
      const result = parse(z.string(), 123);

      it("returns an error", () => {
        expect(result.isErr()).toBe(true);

        if (!result.isErr()) {
          expect.fail();
        }

        expect(result.error).toBeInstanceOf(ZodError);
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
          expect(result.isSome());

          if (!result.isSome()) {
            expect.fail();
          }

          expect(result.value).toBeTypeOf("number");
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
          expect(result.isNone());

          if (!result.isNone()) {
            expect.fail();
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
        expect(result.isSome());

        if (!result.isSome()) {
          expect.fail();
        }

        expect(result.value).toBeTypeOf("number");
      });
    });
  });

  describe.each(["foobar", "-200", "-100.01", "100.01", "200"])(
    "given an invalid ms value",
    (input) => {
      describe("when called", () => {
        const result = parseStringMinMaxInteger(input, { min: -100, max: 100 });

        it("returns an option containing a value", () => {
          expect(result.isNone());

          if (!result.isNone()) {
            expect.fail();
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
        expect(result.isSome());

        if (!result.isSome()) {
          expect.fail();
        }

        expect(result.value).toBeTypeOf("number");
      });
    });
  });

  describe.each(["foobar"])("given an invalid ms value", (input) => {
    describe("when called", () => {
      const result = parseStringMs(input);

      it("returns an option containing a value", () => {
        expect(result.isNone());

        if (!result.isNone()) {
          expect.fail();
        }
      });
    });
  });
});
