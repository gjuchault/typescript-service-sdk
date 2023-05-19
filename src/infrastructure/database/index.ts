import { createPool, DatabasePool, sql } from "slonik";
import { z } from "zod";

import { createLogger, LogLevel } from "../logger/index.js";
import type { Telemetry } from "../telemetry/index.js";
import {
  createSlonikTelemetryInterceptor,
  getSpanOptions,
} from "../telemetry/instrumentations/slonik.js";

interface Dependencies {
  config: {
    logLevel: LogLevel;
    databaseIdleTimeout: number;
    databaseStatementTimeout: number;
    databaseMaximumPoolSize: number;
    databaseUrl: string;
  };
  telemetry: Telemetry;
}

export type Database = DatabasePool;

export async function createDatabase({
  config,
  telemetry,
}: Dependencies): Promise<Database> {
  const logger = createLogger("database", { config });

  const {
    databaseIdleTimeout: idleTimeout,
    databaseStatementTimeout: statementTimeout,
    databaseMaximumPoolSize: maximumPoolSize,
    databaseUrl: url,
  } = config;

  return await telemetry.startSpan(
    "database.connect",
    getSpanOptions({ idleTimeout, maximumPoolSize, config }),
    async () => {
      logger.debug(`connecting to database...`);

      const pool = await createPool(url, {
        captureStackTrace: false,
        statementTimeout,
        interceptors: [createSlonikTelemetryInterceptor({ telemetry, config })],
        idleTimeout,
        maximumPoolSize,
      });

      await pool.query(sql.type(z.unknown())`select 1`);

      logger.info(`connected to database`);

      return pool;
    }
  );
}
