import * as assert from "node:assert/strict";
import { before, describe, it } from "node:test";

import { sql } from "slonik";
import { z } from "zod";

import {
  createFailingQueryMockDatabase,
  createMockDatabase,
  prepareBulkInsert,
} from "../index.js";

describe("createFailingQueryMockDatabase()", () => {
  describe("given no arguments", () => {
    const { database, query } = createFailingQueryMockDatabase();

    describe("when called", () => {
      let hasQueryFailed = false;

      before(async () => {
        try {
          await database.any(sql.unsafe`select id from foobar`);
        } catch {
          hasQueryFailed = true;
        }
      });

      it("throws", () => {
        assert.equal(hasQueryFailed, true);
        assert.equal(query.mock.calls.length, 1);

        assert.deepEqual(query.mock.calls[0]?.arguments, [
          "select id from foobar",
          [],
        ]);
      });
    });
  });
});

describe("createMockDatabase()", () => {
  describe("given a mock result", () => {
    const { database, query } = createMockDatabase([{ id: 1 }, { id: 2 }]);

    describe("when called", () => {
      let result: readonly { id: number }[] = [];

      before(async () => {
        result = await database.any(
          sql.type(z.object({ id: z.number() }))`select id from foobar`
        );
      });

      it("returns the mocked result", () => {
        assert.equal(query.mock.calls.length, 1);
        assert.deepEqual(query.mock.calls[0]?.arguments, [
          "select id from foobar",
          [],
        ]);
        assert.deepEqual(result, [{ id: 1 }, { id: 2 }]);
      });
    });
  });
});

describe("prepareBulkInsert()", () => {
  describe("given an object structure, items and an iteratee", () => {
    describe("when called", () => {
      const prepareBulkInsertResult = prepareBulkInsert(
        [
          ["id", "uuid"],
          ["name", "text"],
          ["index", "int4"],
        ],
        [{ id: "some-uuid", my_name: "John Doe", index: 1 }],
        (user) => ({ id: user.id, name: user.my_name, index: user.index })
      );

      it("returns the columns and data grid", () => {
        assert.equal(prepareBulkInsertResult.isOk(), true);

        if (!prepareBulkInsertResult.isOk()) {
          assert.fail();
        }

        assert.deepEqual(prepareBulkInsertResult.value.columns, {
          type: "SLONIK_TOKEN_LIST",
          glue: sql.fragment`, `,
          members: [
            { names: ["id"], type: "SLONIK_TOKEN_IDENTIFIER" },
            { names: ["name"], type: "SLONIK_TOKEN_IDENTIFIER" },
            { names: ["index"], type: "SLONIK_TOKEN_IDENTIFIER" },
          ],
        });

        assert.deepEqual(prepareBulkInsertResult.value.rows, {
          columnTypes: ["uuid", "text", "int4"],
          tuples: [["some-uuid", "John Doe", 1]],
          type: "SLONIK_TOKEN_UNNEST",
        });
      });
    });
  });
});
