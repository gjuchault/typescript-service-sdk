import { describe, expect, it } from "vitest";

import { none, Option, some } from "../option.js";

function getNone(): Option<string> {
  return none();
}

function getSome(): Option<string> {
  return some("foobar");
}

describe("isSome()", () => {
  describe("given a some", () => {
    const option = getSome();

    describe("when called", () => {
      it("returns true", () => {
        expect(option.isSome()).toBe(true);
      });
    });
  });

  describe("given a none", () => {
    const option = getNone();

    describe("when called", () => {
      it("returns false", () => {
        expect(option.isSome()).toBe(false);
      });
    });
  });
});

describe("isNone()", () => {
  describe("given a some", () => {
    const option = getSome();

    describe("when called", () => {
      it("returns false", () => {
        expect(option.isNone()).toBe(false);
      });
    });
  });

  describe("given a none", () => {
    const option = getNone();

    describe("when called", () => {
      it("returns true", () => {
        expect(option.isNone()).toBe(true);
      });
    });
  });
});

describe("map()", () => {
  describe("given a some and a mapper", () => {
    const option = getSome();
    function mapper(value: string) {
      return value.toUpperCase();
    }

    describe("when called", () => {
      it("returns a some containing the mapped value", () => {
        const result = option.map(mapper);
        expect(result.isSome()).toBe(true);

        if (result.isSome()) {
          expect(result.value).toBe("FOOBAR");
        }
      });
    });
  });

  describe("given a none and a mapper", () => {
    const option = getNone();
    function mapper(value: string) {
      return value.toUpperCase();
    }

    describe("when called", () => {
      it("returns a none", () => {
        const result = option.map(mapper);
        expect(result.isSome()).toBe(false);
      });
    });
  });
});

describe("_unsafeUnwrap()", () => {
  describe("given a some", () => {
    const option = getSome();

    describe("when called", () => {
      it("returns the value", () => {
        expect(option._unsafeUnwrap()).toBe("foobar");
      });
    });
  });

  describe("given a none", () => {
    const option = getNone();

    describe("when called", () => {
      it("throws", () => {
        expect(() => option._unsafeUnwrap()).toThrow(TypeError);
      });
    });
  });
});

describe("unwrapOr()", () => {
  describe("given a some and a fallback", () => {
    const option = getSome();
    const fallback = "fallback";

    describe("when called", () => {
      it("returns the value", () => {
        expect(option.unwrapOr(fallback)).toBe("foobar");
      });
    });
  });

  describe("given a none", () => {
    const option = getNone();
    const fallback = "fallback";

    describe("when called", () => {
      it("throws", () => {
        expect(option.unwrapOr(fallback)).toBe("fallback");
      });
    });
  });
});

describe("andThen()", () => {
  describe("given a some and a mapper that returns a some", () => {
    const option = getSome();
    function mapper(value: string) {
      return some(value.toUpperCase());
    }

    describe("when called", () => {
      it("returns a some containing the mapped value", () => {
        const result = option.andThen(mapper);
        expect(result.isSome()).toBe(true);

        if (result.isSome()) {
          expect(result.value).toBe("FOOBAR");
        }
      });
    });
  });

  describe("given a some and a mapper that returns a none", () => {
    const option = getSome();
    function mapper() {
      return getNone();
    }

    describe("when called", () => {
      it("returns a some containing the mapped value", () => {
        const result = option.andThen(mapper);
        expect(result.isNone()).toBe(true);
      });
    });
  });

  describe("given a none and a mapper that returns a some", () => {
    const option = getNone();
    function mapper(value: string) {
      return some(value.toUpperCase());
    }

    describe("when called", () => {
      it("returns a none", () => {
        const result = option.andThen(mapper);
        expect(result.isSome()).toBe(false);
      });
    });
  });

  describe("given a none and a mapper that returns a none", () => {
    const option = getNone();
    function mapper() {
      return getNone();
    }

    describe("when called", () => {
      it("returns a none", () => {
        const result = option.andThen(mapper);
        expect(result.isSome()).toBe(false);
      });
    });
  });
});

describe("toResult()", () => {
  describe("given a some and a fallback error", () => {
    const option = getSome();
    const fallback = "fallback";

    describe("when called", () => {
      it("returns an Ok", () => {
        const result = option.toResult(fallback);
        expect(result.isOk()).toBe(true);

        if (result.isOk()) {
          expect(result.value).toEqual("foobar");
        }
      });
    });
  });

  describe("given a none", () => {
    const option = getNone();
    const fallback = "fallback";

    describe("when called", () => {
      it("returns false", () => {
        const result = option.toResult(fallback);
        expect(result.isErr()).toBe(true);

        if (result.isErr()) {
          expect(result.error).toEqual("fallback");
        }
      });
    });
  });
});
