import { Span, SpanKind } from "@opentelemetry/api";
import {
  DbSystemValues,
  SemanticAttributes,
} from "@opentelemetry/semantic-conventions";
import { Interceptor, QueryContext } from "slonik";

import type { Telemetry } from "../index.js";

export const PG_VALUES = "db.postgresql.values";
export const IDLE_TIMEOUT_MILLIS = "db.postgresql.idle.timeout.millis";
export const MAX_CLIENT = "db.postgresql.max.client";

export function getSpanOptions({
  idleTimeout,
  maximumPoolSize,
  config,
}: {
  readonly config: { databaseUrl: string };
  readonly idleTimeout: number;
  readonly maximumPoolSize: number;
}) {
  return {
    kind: SpanKind.CLIENT,
    attributes: {
      ...getCommonSpanOptions(config),
      ["db.postgresql.idle.timeout.millis"]: idleTimeout,
      ["db.postgresql.max.client"]: maximumPoolSize,
    },
  };
}

export function createSlonikTelemetryInterceptor({
  telemetry,
  config,
}: {
  telemetry: Telemetry;
  readonly config: { databaseUrl: string };
}): Interceptor {
  const spanByQueryId = new Map<string, Span>();

  return {
    beforeQueryExecution(queryContext, query) {
      const span = telemetry.tracer.startSpan("database.query", {
        kind: SpanKind.CLIENT,
        attributes: {
          ...getCommonSpanOptions(config),
          [SemanticAttributes.DB_OPERATION]: getQueryOperationName(query.sql),
          [SemanticAttributes.DB_STATEMENT]: query.sql,
          [PG_VALUES]: query.values.toString(),
        },
      });

      spanByQueryId.set(getQueryId(queryContext), span);

      return null;
    },
    afterQueryExecution(queryContext) {
      const span = spanByQueryId.get(getQueryId(queryContext));

      if (!span) {
        return null;
      }

      span.end();

      return null;
    },
  };
}

function getCommonSpanOptions(config: { databaseUrl: string }) {
  const databaseUrl = new URL(config.databaseUrl);
  databaseUrl.password = "";

  return {
    [SemanticAttributes.DB_SYSTEM]: DbSystemValues.POSTGRESQL,
    [SemanticAttributes.DB_NAME]: databaseUrl.pathname.slice(1),
    [SemanticAttributes.NET_PEER_NAME]: databaseUrl.hostname,
    [SemanticAttributes.NET_PEER_PORT]: databaseUrl.port,
    [SemanticAttributes.DB_CONNECTION_STRING]: databaseUrl.toString(),
    [SemanticAttributes.DB_USER]: databaseUrl.username,
  };
}

function getQueryId(queryContext: QueryContext): string {
  return [
    queryContext.connectionId,
    queryContext.poolId,
    queryContext.queryId,
  ].join("-");
}

function getQueryOperationName(sql: string): string {
  const words = sql
    .trim()
    .split(" ")
    .filter((word) => word.length > 0);
  return words[0]?.toLowerCase() ?? "unknown";
}
