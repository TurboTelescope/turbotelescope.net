/**
 * Run with:
 *
 *      POSTGRES_URL="postgres://turbo:TURBOTURBO@popcorn.spa.umn.edu:5432/turbo?sslmode=require"
 *      npx tsx ./scripts/playground.ts
 */

import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { DateTime, Effect } from "effect";

import * as Database from "../services/Database.js";

const program = Effect.gen(function* () {
    const db = yield* Database.Database;
    //const sql: SqlClient.SqlClient = yield* SqlClient.SqlClient;

    const from = yield* DateTime.make(0);
    const until = yield* DateTime.now;
    const pps = yield* db.getPipelineStepNamesInRange(from, until);
});

Effect.suspend(() => program)
    .pipe(Effect.provide(Database.PgLive))
    .pipe(Effect.provide(NodeContext.layer))
    .pipe(Effect.provide(Database.Database.Default))
    .pipe(NodeRuntime.runMain);
