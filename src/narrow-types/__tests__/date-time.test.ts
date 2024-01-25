import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { validDateSchema, validDateTimeSchema } from "../date-time.js";

await describe("validDateSchema", async () => {
	await describe("given a valid date", async () => {
		await describe("when called", async () => {
			await it("returns the date", () => {
				const date = "2021-01-01";

				const result = validDateSchema.parse(date);

				assert.equal(result, date);
			});
		});
	});

	await describe("given an invalid date", async () => {
		await describe("when called", async () => {
			await it("returns the date", () => {
				assert.throws(() => validDateSchema.parse("foobar"));
				assert.throws(() => validDateSchema.parse("2021-01-01T00:00:00.000Z"));
			});
		});
	});
});

await describe("validDateTimeSchema", async () => {
	await describe("given a valid date time", async () => {
		await describe("when called", async () => {
			await it("returns the date", () => {
				const date = "2021-01-01T00:00:00.000Z";

				const result = validDateTimeSchema.parse(date);

				assert.equal(result, date);
			});
		});
	});

	await describe("given an invalid date", async () => {
		await describe("when called", async () => {
			await it("returns the date", () => {
				const date = "foobar";

				assert.throws(() => {
					validDateTimeSchema.parse(date);
				});
			});
		});
	});
});
