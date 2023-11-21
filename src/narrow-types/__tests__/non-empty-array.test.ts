import * as assert from "node:assert/strict";
import { describe, it } from "node:test";

import { z } from "zod";

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
} from "../non-empty-array.js";

await describe("createNonEmptyArraySchema()", async () => {
  await describe("given a schema", async () => {
    const schema = z.number();

    await describe("when called", async () => {
      await it("returns a non-empty array schema", () => {
        const neaSchema = createNonEmptyArraySchema(schema);
        assert.equal(neaSchema.safeParse([1]).success, true);
        assert.equal(neaSchema.safeParse(["a"]).success, false);
      });
    });
  });
});

await describe("fromElements()", async () => {
  await describe("given some elements", async () => {
    await describe("when called", async () => {
      await it("returns a non-empty array", () => {
        assert.deepEqual(fromElements(1, 2, 3), [1, 2, 3]);
      });
    });
  });
});

await describe("concat()", async () => {
  await describe("given multiple arrays, the first one being a non-empty array", async () => {
    await describe("when called", async () => {
      const result = concat(
        makeNonEmptyArray(["a", "b", "c"])._unsafeUnwrap(),
        ["d", "e"],
        [],
        ["f"],
      );

      await it("returns the concatenation of the arrays as a non-empty array", () => {
        assert.equal(Array.isArray(result), true);
        assert.equal(typeof result[0], "string");
        assert.deepEqual(result, ["a", "b", "c", "d", "e", "f"]);
      });
    });
  });
});

await describe("filter()", async () => {
  await describe("given a non-empty array and a predicate", async () => {
    await describe("when called", async () => {
      const result = filter(
        makeNonEmptyArray([0, 1, 2, 3, 4, 5, 6])._unsafeUnwrap(),
        (value) => value % 2 === 0,
      );

      await it("returns a subset array", () => {
        assert.equal(result.isSome(), true);

        if (result.isSome()) {
          assert.deepEqual(result.value, [0, 2, 4, 6]);
        } else {
          assert.fail();
        }
      });
    });
  });
});

await describe("flat()", async () => {
  await describe("given a non-empty array, a predicate and no depth parameter", async () => {
    await describe("when called", async () => {
      const result = flat(
        makeNonEmptyArray([0, [[1]], 2, [3], 4, [5, 6]])._unsafeUnwrap(),
      );

      await it("returns a subset array", () => {
        assert.deepEqual(result, [0, [1], 2, 3, 4, 5, 6]);
      });
    });
  });

  await describe("given a non-empty array, a predicate and a depth parameter", async () => {
    await describe("when called", async () => {
      const result = flat(
        makeNonEmptyArray([0, [[1]], 2, [3], 4, [5, 6]])._unsafeUnwrap(),
        10,
      );

      await it("returns a subset array", () => {
        assert.deepEqual(result, [0, 1, 2, 3, 4, 5, 6]);
      });
    });
  });
});

await describe("flatMap()", async () => {
  await describe("given a non-empty array, a predicate and no depth parameter", async () => {
    await describe("when called", async () => {
      const result = flatMap(
        makeNonEmptyArray([[0, 1, 2], [5], [0]])._unsafeUnwrap(),
        (value) => value.reduce((a, b) => a + b, 0),
      );

      await it("returns a subset array", () => {
        assert.deepEqual(result, [3, 5, 0]);
      });
    });
  });
});

await describe("isNonEmptyArray()", async () => {
  await describe("given a non-empty array", async () => {
    await describe("when called", async () => {
      const result = isNonEmptyArray([1, 2, 3]);

      await it("returns true", () => {
        assert.equal(result, true);
      });
    });
  });

  await describe("given an empty array", async () => {
    await describe("when called", async () => {
      const result = isNonEmptyArray([]);

      await it("returns true", () => {
        assert.equal(result, false);
      });
    });
  });
});

await describe("isNonEmptyArray()", async () => {
  await describe("given a non-empty array", async () => {
    await describe("when called", async () => {
      const result = isNonEmptyArray([1, 2, 3]);

      await it("returns true", () => {
        assert.equal(result, true);
      });
    });
  });

  await describe("given an empty array", async () => {
    await describe("when called", async () => {
      const result = isNonEmptyArray([]);

      await it("returns true", () => {
        assert.equal(result, false);
      });
    });
  });
});

await describe("map()", async () => {
  await describe("given a non-empty array and a predicate", async () => {
    await describe("when called", async () => {
      const result = map(
        makeNonEmptyArray([1, 2, 3])._unsafeUnwrap(),
        (value) => value * 2,
      );

      await it("returns the modified array", () => {
        assert.deepEqual(result, [2, 4, 6]);
      });
    });
  });
});

await describe("reverse()", async () => {
  await describe("given a non-empty array and a predicate", async () => {
    await describe("when called", async () => {
      const result = reverse(makeNonEmptyArray([1, 2, 3])._unsafeUnwrap());

      await it("returns the modified array", () => {
        assert.deepEqual(result, [3, 2, 1]);
      });
    });
  });
});

await describe("slice()", async () => {
  await describe("given a non-empty array and a range in the array", async () => {
    await describe("when called", async () => {
      const result = slice(makeNonEmptyArray([1, 2, 3])._unsafeUnwrap(), 1, 2);

      await it("returns the slice array in a some", () => {
        assert.equal(result.isSome(), true);

        if (result.isSome()) {
          assert.deepEqual(result.value, [2]);
        } else {
          assert.fail();
        }
      });
    });
  });

  await describe("given a non-empty array and a range outside the array", async () => {
    await describe("when called", async () => {
      const result = slice(makeNonEmptyArray([1, 2, 3])._unsafeUnwrap(), 5);

      await it("returns none", () => {
        assert.equal(result.isNone(), true);
      });
    });
  });
});
