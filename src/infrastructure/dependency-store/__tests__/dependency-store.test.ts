import * as assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createDependencyStore } from "../index.js";

await describe("createDependencyStore()", async () => {
  await describe("given an extended store type that overrides one of the provider", async () => {
    type ExtendedStore = {
      logger: () => void;
    };

    const store = createDependencyStore<ExtendedStore>();

    await it("should allow to set the provider", () => {
      const loggerOverride = () => {};
      const defaultDateProvider = {
        nowAsNumber() {
          return Date.now();
        },
        nowAsDate() {
          return new Date();
        },
      };

      store.set("logger", loggerOverride);
      store.set("date", defaultDateProvider);

      assert.equal(store.get("logger"), loggerOverride);
      assert.equal(store.get("date"), defaultDateProvider);
    });
  });
});
