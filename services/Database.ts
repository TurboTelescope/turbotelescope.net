import { SqlClient, SqlError, SqlResolver } from "@effect/sql";
import { PgClient } from "@effect/sql-pg";
import {
    Array,
    Config,
    ConfigError,
    DateTime,
    Duration,
    Effect,
    Function,
    Layer,
    ParseResult,
    Record,
    Schema,
    Stream,
    String,
    Tuple,
} from "effect";

import { ResultRow, SchemaName } from "@/services/Domain";

export const PgLive: Layer.Layer<
    PgClient.PgClient | SqlClient.SqlClient,
    ConfigError.ConfigError | SqlError.SqlError,
    never
> = PgClient.layerConfig({
    url: Config.redacted("POSTGRES_URL"),
    transformQueryNames: Config.succeed(String.camelToSnake),
    transformResultNames: Config.succeed(String.snakeToCamel),
});

const make = Effect.gen(function* () {
    const sql: SqlClient.SqlClient = yield* SqlClient.SqlClient;

    const getTableNamesInRange = (
        from: DateTime.Utc,
        until: DateTime.Utc
    ): Effect.Effect<Array<typeof SchemaName.Encoded>, ParseResult.ParseError | SqlError.SqlError, never> =>
        Effect.flatMap(
            sql<{ schemaName: typeof SchemaName.Encoded }>`
                SELECT schema_name
                FROM information_schema.schemata
                WHERE schema_name NOT LIKE 'reference%'`,
            Function.flow(
                Array.map(({ schemaName }) => schemaName),
                Array.filterMap((maybeTableName) => Schema.decodeOption(SchemaName)(maybeTableName)),
                Array.filter(DateTime.between({ minimum: from, maximum: until })),
                Array.sort(DateTime.Order),
                Array.map((tableName) => Schema.encode(SchemaName)(tableName)),
                Effect.allWith({ concurrency: "unbounded" })
            )
        );

    const getDataByTableName = SqlResolver.grouped("getDataByTableName", {
        withContext: true,
        Request: SchemaName.from,
        RequestGroupKey: Function.identity,
        Result: ResultRow,
        ResultGroupKey: (row: ResultRow) => row.sourceTable,
        execute: (
            ids: Array<
                | `science_turbo_production_pipeline_${number}_${number}_${number}_${number}_${number}_${number}`
                | `reference_turbo_production_pipeline_${number}_${number}_${number}_${number}_${number}_${number}`
            >
        ) => {
            const unionQueries = Array.map(
                ids,
                (tableName) => `
                SELECT
                    IMAGE_STATUS.*,
                    IMAGES.*,
                    '${tableName}' as source_table
                FROM "${tableName}".image_status AS IMAGE_STATUS
                LEFT JOIN "${tableName}".images AS IMAGES
                ON IMAGE_STATUS.image_id = IMAGES.image_id`
            );

            return sql.unsafe<ResultRow>(`
                WITH combined_data AS (
                    ${unionQueries.join("\n\n    UNION ALL\n")}
                )
                SELECT * FROM combined_data;`);
        },
    });

    const getDataInRange = (
        from: DateTime.Utc,
        until: DateTime.Utc
    ): Effect.Effect<
        Record.ReadonlyRecord<typeof SchemaName.Encoded, Array<ResultRow>>,
        ParseResult.ParseError | SqlError.SqlError,
        never
    > =>
        Effect.Do.pipe(
            Effect.bind("resolver", () => getDataByTableName),
            Effect.bind("tableNamesInRange", () => getTableNamesInRange(from, until)),
            Effect.flatMap(({ resolver, tableNamesInRange }) =>
                Function.pipe(
                    tableNamesInRange,
                    Record.fromIterableWith((tableName) => Tuple.make(tableName, resolver.execute(tableName))),
                    Effect.allWith({ batching: true })
                )
            )
        );

    const subscribeToDataInRange = (
        from: DateTime.Utc,
        refreshInterval: Duration.DurationInput
    ): Stream.Stream<
        Record.ReadonlyRecord<typeof SchemaName.Encoded, Array<ResultRow>>,
        ParseResult.ParseError | SqlError.SqlError,
        never
    > =>
        Effect.gen(function* () {
            type TupledFromUntil = [from: DateTime.Utc, until: DateTime.Utc];

            const applyRefreshInterval = DateTime.addDuration(refreshInterval);
            const now = yield* Effect.map(DateTime.now, DateTime.subtractDuration(refreshInterval));

            const resolver = Function.tupled(getDataInRange);
            const initial: TupledFromUntil = Tuple.make(now, applyRefreshInterval(now));
            const next = ([_, previousNow]: TupledFromUntil): TupledFromUntil =>
                Tuple.make(previousNow, applyRefreshInterval(previousNow));

            const backlog = Stream.fromEffect(getDataInRange(from, now));
            const reactive = Stream.iterate(initial, next).pipe(Stream.mapEffect(resolver));
            return Stream.concat(backlog, reactive);
        }).pipe(Stream.unwrap);

    return { getDataInRange, subscribeToDataInRange, getTableNamesInRange } as const;
});

export class Database extends Effect.Service<Database>()("app/Database", {
    accessors: false,
    dependencies: [PgLive],
    effect: make,
}) {}
