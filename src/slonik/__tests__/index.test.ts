import { sql } from "slonik";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import {
  createFailingQueryMockDatabase,
  createMockDatabase,
  prepareBulkInsert,
} from "../index.js";

describe("createFailingQueryMockDatabase()", () => {
  describe("given no arguments", () => {
    const { database, query } = createFailingQueryMockDatabase(vi);

    describe("when called", () => {
      let hasQueryFailed = false;

      beforeAll(async () => {
        try {
          await database.any(sql.unsafe`select id from foobar`);
        } catch {
          hasQueryFailed = true;
        }
      });

      it("throws", () => {
        expect(hasQueryFailed).toBe(true);
        expect(query).toBeCalledTimes(1);
        expect(query.mock.calls[0]?.[0]).toEqual("select id from foobar");
      });
    });
  });
});

describe("createMockDatabase()", () => {
  describe("given a mock result", () => {
    const { database, query } = createMockDatabase(vi, [{ id: 1 }, { id: 2 }]);

    describe("when called", () => {
      let result: readonly { id: number }[] = [];

      beforeAll(async () => {
        result = await database.any(
          sql.type(z.object({ id: z.number() }))`select id from foobar`,
        );
      });

      it("returns the mocked result", () => {
        expect(query).toBeCalledTimes(1);
        expect(query.mock.calls[0]?.[0]).toEqual("select id from foobar");
        expect(result).toEqual([{ id: 1 }, { id: 2 }]);
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
        (user) => ({ id: user.id, name: user.my_name, index: user.index }),
      );

      it("returns the columns and data grid", () => {
        expect(prepareBulkInsertResult.isOk()).toBe(true);

        if (!prepareBulkInsertResult.isOk()) {
          expect.fail();
        }

        expect(prepareBulkInsertResult.value.columns).toEqual({
          type: "SLONIK_TOKEN_LIST",
          glue: sql.fragment`, `,
          members: [
            { names: ["id"], type: "SLONIK_TOKEN_IDENTIFIER" },
            { names: ["name"], type: "SLONIK_TOKEN_IDENTIFIER" },
            { names: ["index"], type: "SLONIK_TOKEN_IDENTIFIER" },
          ],
        });

        expect(prepareBulkInsertResult.value.rows).toEqual({
          columnTypes: ["uuid", "text", "int4"],
          tuples: [["some-uuid", "John Doe", 1]],
          type: "SLONIK_TOKEN_UNNEST",
        });
      });
    });
  });
});
