import { mock } from "node:test";

import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";
import type {
  DatabasePool,
  ListSqlToken,
  PrimitiveValueExpression,
  QueryResult,
  QueryResultRow,
  UnnestSqlToken,
} from "slonik";
import {
  createMockPool,
  createMockQueryResult,
  SlonikError,
  sql,
} from "slonik";
import type { ZodError } from "zod";
import { z } from "zod";

import { parse } from "../zod/index.js";

type MockQuery = ReturnType<
  typeof mock.fn<() => Promise<QueryResult<QueryResultRow>>>
>;

export function createMockDatabase(values: readonly QueryResultRow[]): {
  query: MockQuery;
  database: DatabasePool;
} {
  const query = mock.fn(async (): Promise<QueryResult<QueryResultRow>> => {
    return Promise.resolve(createMockQueryResult(values));
  });

  const database = createMockPool({
    query,
  });

  return {
    query,
    database,
  };
}

export function createFailingQueryMockDatabase(): {
  query: MockQuery;
  database: DatabasePool;
} {
  const query = mock.fn(async (): Promise<QueryResult<QueryResultRow>> => {
    return Promise.reject(new SlonikError("Mocked database error"));
  });

  const database = createMockPool({
    query,
  });

  return {
    query,
    database,
  };
}

export function dropAllTables() {
  return sql.type(z.unknown())`
    do $$ declare
        r record;
    begin
        for r in (select tablename from pg_tables where schemaname not in ('pg_catalog', 'information_schema')) loop
            execute 'drop table if exists ' || quote_ident(r.tablename) || ' cascade';
        end loop;
    end $$;
  `;
}

export type PrepareBulkInsertResult = Result<
  { columns: ListSqlToken; rows: UnnestSqlToken },
  PrepareBulkInsertError
>;
export type PrepareBulkInsertError =
  | { reason: "invalidHeaders"; error: ZodError<string[]> }
  | { reason: "invalidRecordDate"; error: ZodError<string | number | Date> };
// Similar to slonik's TypeNameIdentifier without string
type TypeNameIdentifier =
  | "bool"
  | "bytea"
  | "float4"
  | "float8"
  | "int2"
  | "int4"
  | "int8"
  | "json"
  | "text"
  | "timestamptz"
  | "uuid";
export type ColumnDefinition<TRecord> = [keyof TRecord, TypeNameIdentifier];

/**
 * create columns and rows data for slonik bulk insert that are efficient and type-safe
 * @example
 * const res = prepareBulkInsert(
 *   [
 *     ["id", "int4"],
 *     ["name", "text"]
 *   ],
 *   [ \{ id: 1, name: "foo" \}, \{ id: 2, name: "bar" \} ],
 *   record =\> (\{ ...record \})
 * ).unwrap() // example only, please handle errors
 *
 * await connection.query(sql.unsafe\`
 *   insert into "table"($\{res.columns\})
 *   select * from $\{res.rows\}
 * \`);
 * @param columnDefinitions - tuple array of the records keys and their postgres type
 * @param records - records to insert
 * @param iteratee - map method on every record to match the database shape
 */
export function prepareBulkInsert<
  TDatabaseRecord extends Record<string, PrimitiveValueExpression>,
  TRecord,
>(
  columnDefinitions: ColumnDefinition<TDatabaseRecord>[],
  records: TRecord[],
  iteratee: (record: TRecord, i: number) => TDatabaseRecord,
): PrepareBulkInsertResult {
  const headersParseResult = parse(
    z.array(z.string()),
    columnDefinitions.map(([columnName]) => columnName),
  );

  if (headersParseResult.isErr()) {
    return err({ reason: "invalidHeaders", error: headersParseResult.error });
  }

  const columnTypes = columnDefinitions.map(
    (columnDefinition) => columnDefinition[1],
  );

  const rows: PrimitiveValueExpression[][] = [];

  for (const [i, record] of records.entries()) {
    const databaseRecord = iteratee(record, i);

    const columns: PrimitiveValueExpression[] = [];

    for (const [columnName, columnType] of columnDefinitions) {
      if (columnType === "json") {
        columns.push(JSON.stringify(databaseRecord[columnName]));
      }

      if (columnType === "timestamptz") {
        const parseDateResult = parse(
          z
            .union([z.date(), z.number(), z.string()])
            .refine((value) => !Number.isNaN(new Date(value).getTime()))
            .transform((value) => new Date(value)),
          databaseRecord[columnName],
        );

        if (parseDateResult.isErr()) {
          return err({
            reason: "invalidRecordDate",
            error: parseDateResult.error,
          });
        }

        columns.push(parseDateResult.value.toISOString());
      }

      const column = databaseRecord[columnName];
      if (column !== undefined) {
        columns.push(column);
      }
    }

    rows.push(columns);
  }

  const columns = sql.join(
    headersParseResult.value.map((header) => sql.identifier([header])),
    sql.fragment`, `,
  );

  return ok({
    columns,
    rows: sql.unnest(rows, columnTypes),
  });
}
