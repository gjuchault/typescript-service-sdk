import { createHttpTerminator } from "http-terminator";
import ms from "ms";

import { promiseWithTimeout } from "../../helpers/promise-with-timeout.js";
import { api } from "../../opentelemetry/index.js";
import type { DependencyStore } from "../index.js";

const { context, trace } = api;

export type Dependencies = {
  config: { name: string; version: string };
  dependencyStore: DependencyStore;
  exit: (statusCode: number) => void;
};

export type ShutdownManager = {
  listenToProcessEvents: () => void;
  shutdown: (shouldExit?: boolean) => Promise<void>;
};

export function createShutdownManager({
  config,
  dependencyStore,
  exit,
}: Dependencies) {
  const createLogger = dependencyStore.get("logger");
  const telemetry = dependencyStore.get("telemetry");
  const cache = dependencyStore.get("cache");
  const database = dependencyStore.get("database");
  const taskScheduling = dependencyStore.get("taskScheduling");
  const httpServer = dependencyStore.get("httpServer");

  const logger = createLogger("shutdown");

  const httpTerminator = createHttpTerminator({
    server: httpServer.server,
    gracefulTerminationTimeout: ms("10s"),
  });

  let isShuttingDown = false;

  async function shutdown(shouldExit = true) {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;

    logger.info("received termination event, shutting down...");

    const gracefulShutdownTimeout = "20s";

    async function gracefulShutdown() {
      await Promise.all(taskScheduling.allQueues.map((queue) => queue.close()));
      await Promise.all(
        taskScheduling.allWorkers.map((worker) => worker.close()),
      );
      await Promise.all(
        taskScheduling.allConnections.map((cache) => cache.quit()),
      );
      logger.debug("task scheduling shut down");
      await httpTerminator.terminate();
      logger.debug("http server shut down");
      await database.end();
      logger.debug("database shut down");
      await cache.quit();
      logger.debug("cache shut down");
      await telemetry.shutdown();
      context.disable();
      trace.disable();
      logger.debug("telemetry shut down");

      return true;
    }

    let success = true;
    try {
      await promiseWithTimeout(ms(gracefulShutdownTimeout), gracefulShutdown);
    } catch {
      success = false;
    }

    if (success) {
      logger.info(`gracefully shut down service ${config.name}`, {
        version: config.version,
        nodeVersion: process.version,
        arch: process.arch,
        platform: process.platform,
      });
    } else {
      logger.fatal(
        `could not gracefully shut down service ${config.name} after ${gracefulShutdownTimeout}`,
        {
          version: config.version,
          nodeVersion: process.version,
          arch: process.arch,
          platform: process.platform,
        },
      );

      if (shouldExit) {
        return exit(1);
      }
    }

    logger.flush();

    if (shouldExit) {
      return exit(0);
    }
  }

  function listenToProcessEvents() {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    process.addListener("SIGTERM", async () => {
      await shutdown();
    });
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    process.addListener("SIGINT", async () => {
      await shutdown();
    });
  }

  return { listenToProcessEvents, shutdown };
}
