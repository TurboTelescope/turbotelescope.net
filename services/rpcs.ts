import { Effect, Layer } from "effect";

import { Database } from "@/services/Database";
import { DatabaseRpcs } from "@/services/Domain";

export const Live = DatabaseRpcs.toLayer(
    Effect.gen(function* () {
        const db = yield* Database;

        return {
            RunsInTimeRangeRequest: ({ from, until }) =>
                Effect.flatMap(Database, (database) => database.getDataInRange(from, until)).pipe(Effect.orDie),
        };
    })
).pipe(Layer.provide(Database.Default));
