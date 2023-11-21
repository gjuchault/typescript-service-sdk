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

await describe("isSome()", async () => {
  await describe("given a some", async () => {
    const option = getSome();

    await describe("when called", async () => {
      await it("returns true", () => {
        assert.equal(option.isSome(), true);
      });
    });
  });

  await describe("given a none", async () => {
    const option = getNone();

    await describe("when called", async () => {
      await it("returns false", () => {
        assert.equal(option.isSome(), false);
      });
    });
  });
});

await describe("isNone()", async () => {
  await describe("given a some", async () => {
    const option = getSome();

    await describe("when called", async () => {
      await it("returns false", () => {
        assert.equal(option.isNone(), false);
      });
    });
  });

  await describe("given a none", async () => {
    const option = getNone();

    await describe("when called", async () => {
      await it("returns true", () => {
        assert.equal(option.isNone(), true);
      });
    });
  });
});

await describe("map()", async () => {
  await describe("given a some and a mapper", async () => {
    const option = getSome();
    function mapper(value: string) {
      return value.toUpperCase();
    }

    await describe("when called", async () => {
      await it("returns a some containing the mapped value", () => {
        const result = option.map(mapper);
        assert.equal(result.isSome(), true);

        if (result.isSome()) {
          assert.equal(result.value, "FOOBAR");
        }
      });
    });
  });

  await describe("given a none and a mapper", async () => {
    const option = getNone();
    function mapper(value: string) {
      return value.toUpperCase();
    }

    await describe("when called", async () => {
      await it("returns a none", () => {
        const result = option.map(mapper);
        assert.equal(result.isSome(), false);
      });
    });
  });
});

await describe("_unsafeUnwrap()", async () => {
  await describe("given a some", async () => {
    const option = getSome();

    await describe("when called", async () => {
      await it("returns the value", () => {
        assert.equal(option._unsafeUnwrap(), "foobar");
      });
    });
  });

  await describe("given a none", async () => {
    const option = getNone();

    await describe("when called", async () => {
      await it("throws", () => {
        assert.throws(() => option._unsafeUnwrap(), TypeError);
      });
    });
  });
});

await describe("unwrapOr()", async () => {
  await describe("given a some and a fallback", async () => {
    const option = getSome();
    const fallback = "fallback";

    await describe("when called", async () => {
      await it("returns the value", () => {
        assert.equal(option.unwrapOr(fallback), "foobar");
      });
    });
  });

  await describe("given a none", async () => {
    const option = getNone();
    const fallback = "fallback";

    await describe("when called", async () => {
      await it("throws", () => {
        assert.equal(option.unwrapOr(fallback), "fallback");
      });
    });
  });
});

await describe("andThen()", async () => {
  await describe("given a some and a mapper that returns a some", async () => {
    const option = getSome();
    function mapper(value: string) {
      return some(value.toUpperCase());
    }

    await describe("when called", async () => {
      await it("returns a some containing the mapped value", () => {
        const result = option.andThen(mapper);
        assert.equal(result.isSome(), true);

        if (result.isSome()) {
          assert.equal(result.value, "FOOBAR");
        }
      });
    });
  });

  await describe("given a some and a mapper that returns a none", async () => {
    const option = getSome();
    function mapper() {
      return getNone();
    }

    await describe("when called", async () => {
      await it("returns a some containing the mapped value", () => {
        const result = option.andThen(mapper);
        assert.equal(result.isNone(), true);
      });
    });
  });

  await describe("given a none and a mapper that returns a some", async () => {
    const option = getNone();
    function mapper(value: string) {
      return some(value.toUpperCase());
    }

    await describe("when called", async () => {
      await it("returns a none", () => {
        const result = option.andThen(mapper);
        assert.equal(result.isSome(), false);
      });
    });
  });

  await describe("given a none and a mapper that returns a none", async () => {
    const option = getNone();
    function mapper() {
      return getNone();
    }

    await describe("when called", async () => {
      await it("returns a none", () => {
        const result = option.andThen(mapper);
        assert.equal(result.isSome(), false);
      });
    });
  });
});

await describe("toResult()", async () => {
  await describe("given a some and a fallback error", async () => {
    const option = getSome();
    const fallback = "fallback";

    await describe("when called", async () => {
      await it("returns an Ok", () => {
        const result = option.toResult(fallback);
        assert.equal(result.isOk(), true);

        if (result.isOk()) {
          assert.equal(result.value, "foobar");
        }
      });
    });
  });

  await describe("given a none", async () => {
    const option = getNone();
    const fallback = "fallback";

    await describe("when called", async () => {
      await it("returns false", () => {
        const result = option.toResult(fallback);
        assert.equal(result.isErr(), true);

        if (result.isErr()) {
          assert.equal(result.error, "fallback");
        }
      });
    });
  });
});

await describe("toString()", async () => {
  await describe("given a some", async () => {
    const option = getSome();

    await describe("when called", () => {
      it("returns a string representation of the value", () => {
        assert.equal(option.toString(), "Some(foobar)");
      });
    });
  });

  await describe("given a none", async () => {
    const option = getNone();

    await describe("when called", () => {
      it("returns a string representation of the value", () => {
        assert.equal(option.toString(), "None");
      });
    });
  });
});
