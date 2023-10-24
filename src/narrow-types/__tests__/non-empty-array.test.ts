import * as assert from "node:assert/strict";

import { describe, it } from "vitest";

import {
  concat,
  filter,
  flat,
  flatMap,
  isNonEmptyArray,
  makeNonEmptyArray,
  map,
  reverse,
  slice,
} from "../non-empty-array.js";

describe("concat()", () => {
  describe("given multiple arrays, the first one being a non-empty array", () => {
    describe("when called", () => {
      const result = concat(
        makeNonEmptyArray(["a", "b", "c"])._unsafeUnwrap(),
        ["d", "e"],
        [],
        ["f"]
      );

      it("returns the concatenation of the arrays as a non-empty array", () => {
        assert.equal(Array.isArray(result), true);
        assert.equal(typeof result[0], "string");
        assert.deepEqual(result, ["a", "b", "c", "d", "e", "f"]);
      });
    });
  });
});

describe("filter()", () => {
  describe("given a non-empty array and a predicate", () => {
    describe("when called", () => {
      const result = filter(
        makeNonEmptyArray([0, 1, 2, 3, 4, 5, 6])._unsafeUnwrap(),
        (value) => value % 2 === 0
      );

      it("returns a subset array", () => {
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

describe("flat()", () => {
  describe("given a non-empty array, a predicate and no depth parameter", () => {
    describe("when called", () => {
      const result = flat(
        makeNonEmptyArray([0, [[1]], 2, [3], 4, [5, 6]])._unsafeUnwrap()
      );

      it("returns a subset array", () => {
        assert.deepEqual(result, [0, [1], 2, 3, 4, 5, 6]);
      });
    });
  });

  describe("given a non-empty array, a predicate and a depth parameter", () => {
    describe("when called", () => {
      const result = flat(
        makeNonEmptyArray([0, [[1]], 2, [3], 4, [5, 6]])._unsafeUnwrap(),
        10
      );

      it("returns a subset array", () => {
        assert.deepEqual(result, [0, 1, 2, 3, 4, 5, 6]);
      });
    });
  });
});

describe("flatMap()", () => {
  describe("given a non-empty array, a predicate and no depth parameter", () => {
    describe("when called", () => {
      const result = flatMap(
        makeNonEmptyArray([[0, 1, 2], [5], [0]])._unsafeUnwrap(),
        (value) => value.reduce((a, b) => a + b, 0)
      );

      it("returns a subset array", () => {
        assert.deepEqual(result, [3, 5, 0]);
      });
    });
  });
});

describe("isNonEmptyArray()", () => {
  describe("given a non-empty array", () => {
    describe("when called", () => {
      const result = isNonEmptyArray([1, 2, 3]);

      it("returns true", () => {
        assert.equal(result, true);
      });
    });
  });

  describe("given an empty array", () => {
    describe("when called", () => {
      const result = isNonEmptyArray([]);

      it("returns true", () => {
        assert.equal(result, false);
      });
    });
  });
});

describe("isNonEmptyArray()", () => {
  describe("given a non-empty array", () => {
    describe("when called", () => {
      const result = isNonEmptyArray([1, 2, 3]);

      it("returns true", () => {
        assert.equal(result, true);
      });
    });
  });

  describe("given an empty array", () => {
    describe("when called", () => {
      const result = isNonEmptyArray([]);

      it("returns true", () => {
        assert.equal(result, false);
      });
    });
  });
});

describe("map()", () => {
  describe("given a non-empty array and a predicate", () => {
    describe("when called", () => {
      const result = map(
        makeNonEmptyArray([1, 2, 3])._unsafeUnwrap(),
        (value) => value * 2
      );

      it("returns the modified array", () => {
        assert.deepEqual(result, [2, 4, 6]);
      });
    });
  });
});

describe("reverse()", () => {
  describe("given a non-empty array and a predicate", () => {
    describe("when called", () => {
      const result = reverse(makeNonEmptyArray([1, 2, 3])._unsafeUnwrap());

      it("returns the modified array", () => {
        assert.deepEqual(result, [3, 2, 1]);
      });
    });
  });
});

describe("slice()", () => {
  describe("given a non-empty array and a range in the array", () => {
    describe("when called", () => {
      const result = slice(makeNonEmptyArray([1, 2, 3])._unsafeUnwrap(), 1, 2);

      it("returns the slice array in a some", () => {
        assert.equal(result.isSome(), true);

        if (result.isSome()) {
          assert.deepEqual(result.value, [2]);
        } else {
          assert.fail();
        }
      });
    });
  });

  describe("given a non-empty array and a range outside the array", () => {
    describe("when called", () => {
      const result = slice(makeNonEmptyArray([1, 2, 3])._unsafeUnwrap(), 5);

      it("returns none", () => {
        assert.equal(result.isNone(), true);
      });
    });
  });
});
