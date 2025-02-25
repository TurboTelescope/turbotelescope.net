/**
 * Run with:
 *
 *      POSTGRES_URL="postgres://postgres:password@postgres:5432/turbo?sslmode=require"
 *      npx tsx ./scripts/CheckPipelineStepNames.ts
 */

import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { SqlClient } from "@effect/sql";
import { Array, Console, DateTime, Effect, Function, HashSet, Schema } from "effect";

import * as Database from "../services/Database.js";
import * as Domain from "../services/Domain.js";

const program = Effect.gen(function* () {
    const db = yield* Database.Database;
    const sql: SqlClient.SqlClient = yield* SqlClient.SqlClient;

    const from = yield* DateTime.make(0);
    const until = yield* DateTime.now;
    const tables = yield* db.getTableNamesInRange(from, until);

    const names = yield* Function.pipe(
        Array.map(tables, (tableName) =>
            sql.unsafe<{ readonly pipelineStep: string }>(
                `SELECT IMAGE_STATUS.pipeline_step FROM "${tableName}".image_status AS IMAGE_STATUS`
            )
        ),
        Effect.all,
        Effect.map(Array.flatten),
        Effect.map(Array.map(({ pipelineStep }) => pipelineStep)),
        Effect.map(HashSet.fromIterable)
    );

    // Uncomment to see all the names
    // yield* Console.log(names);

    for (const name of names) {
        const check = Schema.is(Domain.PipelineStepName);
        if (!check(name)) {
            yield* Console.log(`pipeline step name "${name}" is not handled`);
        }
    }
});

Effect.suspend(() => program)
    .pipe(Effect.provide(Database.PgLive))
    .pipe(Effect.provide(NodeContext.layer))
    .pipe(Effect.provide(Database.Database.Default))
    .pipe(NodeRuntime.runMain);
