import { Redis } from "ioredis";
import ms from "ms";
import { promiseWithTimeout } from "../../helpers/promise-with-timeout.js";
import { createLogger, type LogLevel } from "../logger/index.js";
import { type Telemetry } from "../telemetry/index.js";
import { getSpanOptions } from "../telemetry/instrumentations/ioredis.js";

interface Dependencies {
  config: { redisUrl: string; logLevel: LogLevel };
  telemetry: Telemetry;
}

export type Cache = Redis;

export async function createCacheStorage({
  config,
  telemetry,
}: Dependencies): Promise<Cache> {
  const logger = createLogger("redis", { logLevel: config.logLevel });

  const redis = new Redis(config.redisUrl, {});

  redis.on("error", (error) => {
    if (!isRedisError(error)) {
      throw error;
    }

    // these will be spamming quite a log stderr
    if (isRedisConnRefusedError(error)) {
      return;
    }

    logger.error("redis error", { error });
  });

  return await telemetry.startSpan(
    "redis.connect",
    getSpanOptions(config.redisUrl),
    async () => {
      logger.debug("connecting to redis...");

      try {
        await promiseWithTimeout(ms("2s"), () => redis.echo("1"));
      } catch (error) {
        logger.error("redis connection error", { error });
        throw error;
      }

      logger.info("connected to redis");

      return redis;
    }
  );
}

function isRedisError(error: unknown): error is object {
  return typeof error === "object" && error !== null;
}

function isRedisConnRefusedError(error: object): error is { code: string } {
  if ("code" in error) {
    return (error as { code: string }).code === "ECONNREFUSED";
  }

  return false;
}
