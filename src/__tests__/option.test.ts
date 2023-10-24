import * as assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Option } from "../option.js";
import { none, some } from "../option.js";

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
        assert.equal(option.isSome(), true);
      });
    });
  });

  describe("given a none", () => {
    const option = getNone();

    describe("when called", () => {
      it("returns false", () => {
        assert.equal(option.isSome(), false);
      });
    });
  });
});

describe("isNone()", () => {
  describe("given a some", () => {
    const option = getSome();

    describe("when called", () => {
      it("returns false", () => {
        assert.equal(option.isNone(), false);
      });
    });
  });

  describe("given a none", () => {
    const option = getNone();

    describe("when called", () => {
      it("returns true", () => {
        assert.equal(option.isNone(), true);
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
        assert.equal(result.isSome(), true);

        if (result.isSome()) {
          assert.equal(result.value, "FOOBAR");
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
        assert.equal(result.isSome(), false);
      });
    });
  });
});

describe("_unsafeUnwrap()", () => {
  describe("given a some", () => {
    const option = getSome();

    describe("when called", () => {
      it("returns the value", () => {
        assert.equal(option._unsafeUnwrap(), "foobar");
      });
    });
  });

  describe("given a none", () => {
    const option = getNone();

    describe("when called", () => {
      it("throws", () => {
        assert.throws(() => option._unsafeUnwrap(), TypeError);
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
        assert.equal(option.unwrapOr(fallback), "foobar");
      });
    });
  });

  describe("given a none", () => {
    const option = getNone();
    const fallback = "fallback";

    describe("when called", () => {
      it("throws", () => {
        assert.equal(option.unwrapOr(fallback), "fallback");
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
        assert.equal(result.isSome(), true);

        if (result.isSome()) {
          assert.equal(result.value, "FOOBAR");
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
        assert.equal(result.isNone(), true);
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
        assert.equal(result.isSome(), false);
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
        assert.equal(result.isSome(), false);
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
        assert.equal(result.isOk(), true);

        if (result.isOk()) {
          assert.equal(result.value, "foobar");
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
        assert.equal(result.isErr(), true);

        if (result.isErr()) {
          assert.equal(result.error, "fallback");
        }
      });
    });
  });
});
