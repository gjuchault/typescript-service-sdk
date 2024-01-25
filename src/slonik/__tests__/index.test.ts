import * as assert from "node:assert/strict";
import { before, describe, it } from "node:test";

import { sql } from "slonik";
import { z } from "zod";

import {
	createFailingQueryMockDatabase,
	createMockDatabase,
	prepareBulkInsert,
} from "../index.js";

await describe("createFailingQueryMockDatabase()", async () => {
	await describe("given no arguments", async () => {
		const { database, query } = createFailingQueryMockDatabase();

		await describe("when called", async () => {
			let hasQueryFailed = false;

			before(async () => {
				try {
					await database.any(sql.unsafe`select id from foobar`);
				} catch {
					hasQueryFailed = true;
				}
			});

			await it("throws", () => {
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

await describe("createMockDatabase()", async () => {
	await describe("given a mock result", async () => {
		const { database, query } = createMockDatabase([{ id: 1 }, { id: 2 }]);

		await describe("when called", async () => {
			let result: readonly { id: number }[] = [];

			before(async () => {
				result = await database.any(
					sql.type(z.object({ id: z.number() }))`select id from foobar`,
				);
			});

			await it("returns the mocked result", () => {
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

await describe("prepareBulkInsert()", async () => {
	await describe("given an object structure, items and an iteratee", async () => {
		await describe("when called", async () => {
			const prepareBulkInsertResult = prepareBulkInsert(
				[
					["id", "uuid"],
					["name", "text"],
					["index", "int4"],
				],
				// biome-ignore lint/style/useNamingConvention: database are usually using snake_case
				[{ id: "some-uuid", my_name: "John Doe", index: 1 }],
				(user) => ({ id: user.id, name: user.my_name, index: user.index }),
			);

			await it("returns the columns and data grid", () => {
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
