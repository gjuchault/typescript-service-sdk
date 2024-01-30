import type { DatabasePool } from "slonik";
import { createPool, sql } from "slonik";
import { z } from "zod";

import type { DependencyStore } from "../index.js";
import {
	createSlonikTelemetryInterceptor,
	getSpanOptions,
} from "../telemetry/instrumentations/slonik.js";

export type Dependencies = {
	config: {
		databaseIdleTimeout: number;
		databaseStatementTimeout: number;
		databaseMaximumPoolSize: number;
		databaseUrl: string;
	};
	dependencyStore: DependencyStore;
};

export type Database = DatabasePool;

export async function createDatabase({
	config,
	dependencyStore,
}: Dependencies): Promise<Database> {
	const createLogger = dependencyStore.get("logger");
	const telemetry = dependencyStore.get("telemetry");
	const logger = createLogger("database");

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
			logger.debug("connecting to database...");

			const pool = await createPool(url, {
				captureStackTrace: false,
				statementTimeout,
				interceptors: [createSlonikTelemetryInterceptor({ telemetry, config })],
				idleTimeout,
				maximumPoolSize,
			});

			await pool.query(sql.type(z.unknown())`select 1`);

			logger.info("connected to database");

			return pool;
		},
	);
}
