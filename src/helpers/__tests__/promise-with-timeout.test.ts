import * as assert from "node:assert/strict";
import { describe, it, mock } from "node:test";

import { setTimeout } from "timers/promises";

import { promiseWithTimeout } from "../promise-with-timeout.js";

await describe("promiseWithTimeout()", async () => {
  await describe("given a function that resolves instantly", async () => {
    const fn = mock.fn(async () => {});

    await describe("when called", async () => {
      await it("calls the function", async () => {
        await assert.doesNotReject(async () => {
          await promiseWithTimeout(20, fn);
        });
      });
    });
  });

  await describe("given a function that does not resolve in time", async () => {
    const fn = mock.fn(async () => {
      await setTimeout(1000);
    });

    await describe("when called", async () => {
      await describe("when called", async () => {
        await it("calls the function", async () => {
          await assert.rejects(async () => {
            await promiseWithTimeout(20, fn);
          });
        });
      });
    });
  });
});
