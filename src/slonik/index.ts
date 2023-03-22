import {
  createMockPool,
  createMockQueryResult,
  SlonikError,
  sql,
  type UnnestSqlToken,
  type ListSqlToken,
  type PrimitiveValueExpression,
  type DatabasePool,
  type QueryResult,
  type QueryResultRow,
} from "slonik";
import { vi, type Mock } from "vitest";
import { z, ZodError } from "zod";
import { Result, ok, err } from "../tsResults.js";
import { parse } from "../zod/index.js";

export function createMockDatabase(results: readonly QueryResultRow[]): {
  database: DatabasePool;
  query: Mock<[string], Promise<QueryResult<QueryResultRow>>>;
} {
  const query = vi
    .fn<[string], Promise<QueryResult<QueryResultRow>>>()
    .mockResolvedValue(createMockQueryResult(results));

  const database = createMockPool({
    query,
  });

  return {
    query,
    database,
  };
}

export function createFailingQueryMockDatabase(): {
  database: DatabasePool;
  query: Mock<[string], Promise<QueryResult<QueryResultRow>>>;
} {
  const query = vi
    .fn<[string], Promise<QueryResult<QueryResultRow>>>()
    .mockImplementation(() => {
      throw new SlonikError("Mocked database error");
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
type ColumnDefinition<TRecord> = [keyof TRecord, TypeNameIdentifier];

export function prepareBulkInsert<
  TDatabaseRecord extends Record<string, PrimitiveValueExpression>,
  TRecord
>(
  columnDefinitions: ColumnDefinition<TDatabaseRecord>[],
  records: TRecord[],
  iteratee: (record: TRecord, i: number) => TDatabaseRecord
): PrepareBulkInsertResult {
  const headersParseResult = parse(
    z.array(z.string()),
    columnDefinitions.map(([columnName]) => columnName)
  );

  if (headersParseResult.err) {
    return err({ reason: "invalidHeaders", error: headersParseResult.val });
  }

  const columnTypes = columnDefinitions.map(
    (columnDefinition) => columnDefinition[1]
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
          databaseRecord[columnName]
        );

        if (parseDateResult.err) {
          return err({
            reason: "invalidRecordDate",
            error: parseDateResult.val,
          });
        }

        columns.push(parseDateResult.val.toISOString());
      }

      columns.push(databaseRecord[columnName]);
    }

    rows.push(columns);
  }

  const columns = sql.join(
    headersParseResult.val.map((header) => sql.identifier([header])),
    sql.fragment`, `
  );

  return ok({
    columns,
    rows: sql.unnest(rows, columnTypes),
  });
}
