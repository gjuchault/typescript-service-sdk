import * as assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Logger } from "pino";

import { createDependencyStore } from "../index.js";

await describe("createDependencyStore()", async () => {
  await describe("given an extended store type that overrides one of the provider", async () => {
    type ExtendedStore = {
      logger: () => void;
      foo: "baz";
    };

    const defaultLogger = () => {
      const logger = (() => {}) as unknown as Logger;
      return logger;
    };

    const defaultDateProvider = {
      nowAsNumber() {
        return Date.now();
      },
      nowAsDate() {
        return new Date();
      },
    };

    const store = createDependencyStore<ExtendedStore>({
      logger: defaultLogger,
      date: defaultDateProvider,
    });

    await it("should allow to set the provider", () => {
      const loggerOverride = () => {};

      // @ts-expect-error the following line should fail without this expect-error
      store.set("logger", loggerOverride);

      assert.equal(store.get("logger"), loggerOverride);
      assert.equal(store.get("date"), defaultDateProvider);
    });
  });
});
