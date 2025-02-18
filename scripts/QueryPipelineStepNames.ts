import * as NodeContext from "@effect/platform-node/NodeContext";
import * as NodeRuntime from "@effect/platform-node/NodeRuntime";
import * as SqlClient from "@effect/sql/SqlClient";
import * as Array from "effect/Array";
import * as Console from "effect/Console";
import * as DateTime from "effect/DateTime";
import * as Effect from "effect/Effect";
import * as Function from "effect/Function";
import * as HashSet from "effect/HashSet";

import * as Database from "../services/Database.js";

const program = Effect.gen(function* () {
    const db = yield* Database.Database;
    const sql: SqlClient.SqlClient = yield* SqlClient.SqlClient;

    const from = yield* DateTime.make(0);
    const until = yield* DateTime.now;
    const tables = yield* db.getTableNamesInRange(from, until);

    const names = yield* Function.pipe(
        Array.map(
            tables,
            (tableName) => sql<{ readonly pipelineStep: string }>`
                SELECT IMAGE_STATUS.pipelineStep
                FROM "${tableName}".image_status AS IMAGE_STATUS`
        ),
        Effect.all,
        Effect.map(Array.flatten),
        Effect.map(Array.map(({ pipelineStep }) => pipelineStep)),
        Effect.map(HashSet.fromIterable)
    );

    yield* Console.log(names);
});

Effect.suspend(() => program)
    .pipe(Effect.provide(Database.PgLive))
    .pipe(Effect.provide(NodeContext.layer))
    .pipe(Effect.provide(Database.Database.Default))
    .pipe(NodeRuntime.runMain);
