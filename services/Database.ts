//TODO: #16 infallible pipeline step names :3

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
    //Getting long and short names from the database
    //const getPipelineStepNames = SqlResolver.grouped("getPipelineStepNames", {...

    //rm: IMAGES.exposure_time, IMAGES.observation_date,
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
                    IMAGE_STATUS.image_id,
                    IMAGE_STATUS.pipeline_step,
                    IMAGE_STATUS.processing_time,
                    IMAGE_STATUS.completion,
                    IMAGES.file_path,

                    '${tableName}' as source_table
                FROM "${tableName}".image_status AS IMAGE_STATUS
                LEFT JOIN "${tableName}".images AS IMAGES
                ON IMAGE_STATUS.image_id = IMAGES.image_id`
            );

            const query = `
                WITH combined_data AS (
                    ${unionQueries.join("\n\n    UNION ALL\n")}
                )
                SELECT * FROM combined_data;`;

            //console.log("Generated SQL Query:", query); // Log the query for debugging
            return sql.unsafe<ResultRow>(query);
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

    /**
     * The function `getPipelineStepNamesInRange` retrieves pipeline step names
     * within a specified date range using Effect monads in TypeScript.
     *
     * @param from - The `from` parameter represents the starting point in time
     *   for the range you want to query. It is of type `DateTime.Utc`.
     * @param until - The `until` parameter represents the end date and time in
     *   UTC format for the range within which you want to retrieve pipeline
     *   step names.
     */
    const getPipelineStepNamesInRange = (
        from: DateTime.Utc,
        until: DateTime.Utc
    ): Effect.Effect<
        Record.ReadonlyRecord<typeof SchemaName.Encoded, Array<string>>,
        ParseResult.ParseError | SqlError.SqlError,
        never
    > =>
        Effect.Do.pipe(
            Effect.bind("tableNamesInRange", () => getTableNamesInRange(from, until)),
            Effect.flatMap(({ tableNamesInRange }) =>
                Function.pipe(
                    tableNamesInRange,
                    Record.fromIterableWith((tableName) => {
                        // const a = sql.unsafe<{ pipelineStep: string }>(
                        //     `SELECT pipeline_step FROM "${tableName}".status;`
                        // );
                        // console.log(a.compile());
                        return Tuple.make(
                            tableName,

                            sql<{ pipelineStep: string }>`SELECT pipeline_step FROM "${tableName}".status;`.pipe(
                                Effect.map(Array.map(({ pipelineStep }) => pipelineStep))
                            )
                        );
                    }),
                    Effect.allWith({ batching: true })
                )
            )
        );
    return { getDataInRange, subscribeToDataInRange, getTableNamesInRange, getPipelineStepNamesInRange } as const;
});

export class Database extends Effect.Service<Database>()("app/Database", {
    accessors: false,
    dependencies: [PgLive],
    effect: make,
}) {}
