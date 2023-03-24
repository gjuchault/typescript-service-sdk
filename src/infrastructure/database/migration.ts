import fs from "node:fs/promises";
import { sql } from "slonik";
import { InputMigrations, Umzug } from "umzug";
import { z } from "zod";
import type { Database } from "./index.js";

export function buildMigration({
  migrationFiles,
  database,
}: {
  migrationFiles: InputMigrations<Record<never, never>>;
  database: Database;
}) {
  async function ensureTable() {
    await database.query(sql.type(z.unknown())`
      create table if not exists "public"."migrations" (
        "name" varchar, primary key ("name")
      );
    `);
  }

  async function executed() {
    await ensureTable();
    const migrations = await database.anyFirst(sql.type(
      z.object({ name: z.string() })
    )`
      select "name"
      from "public"."migrations"
      order by "name" asc;
    `);

    return [...migrations];
  }

  async function logMigration({ name }: { name: string }) {
    await database.query(sql.type(z.unknown())`
      insert into "public"."migrations" ("name")
      values (${name});
    `);
  }

  async function unlogMigration({ name }: { name: string }) {
    await ensureTable();

    await database.query(sql.type(z.unknown())`
      delete from "public"."migrations"
      where "name" = ${name};
    `);
  }

  const umzug = new Umzug<Record<never, never>>({
    migrations: migrationFiles,
    logger: undefined,
    storage: {
      executed,
      logMigration,
      unlogMigration,
    },
  });

  return umzug;
}

/**
 * Do not use this in production, as it assumes the file structure
 * Should only be used in tests
 */
export async function extractMigrations(
  database: Database,
  migrationsFilesAbsolutePaths: string[]
) {
  return await Promise.all(
    migrationsFilesAbsolutePaths
      .filter((file) => file.endsWith(".sql"))
      .map(async (file) => {
        const content = await fs.readFile(file, "utf8");

        const query = sql.type(z.unknown())([content]);

        return {
          name: file.slice(file.indexOf("_") + 1, -1 * ".sql".length),
          async up() {
            await database.query(query);
          },
          async down() {
            // no support for down migrations
          },
        };
      })
  );
}
