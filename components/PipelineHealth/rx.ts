"use client";

import { Result, Rx } from "@effect-rx/rx-react";
import { FetchHttpClient } from "@effect/platform";
import {
    Array,
    Brand,
    Cause,
    Chunk,
    DateTime,
    Duration,
    Effect,
    Either,
    Function,
    HashSet,
    Layer,
    Match,
    Number,
    Option,
    Predicate,
    Record,
    Scope,
    Sink,
    Stream,
} from "effect";

import { DatabaseRpcs, ResultRow, SchemaName } from "@/services/Domain";
import { RpcClient, RpcSerialization } from "@effect/rpc";

// Choose which protocol to use
const ProtocolLive = RpcClient.layerProtocolHttp({
    url: `${process.env.NEXT_PUBLIC_URL}/api`,
}).pipe(
    Layer.provide([
        // use fetch for http requests
        FetchHttpClient.layer,
        // use ndjson for serialization
        RpcSerialization.layerNdjson,
    ])
);

/** Rx runtime. */
const runtime = Rx.runtime(ProtocolLive);

// ------------------------------------------------------------
//            Rx Atoms for pipeline health page
// ------------------------------------------------------------

/**
 * "localeRx" tracks the current timezone/locale that the user has selected,
 * which is an IANA time zone identifier.
 */
export const localeRx = Rx.fn<string, Cause.IllegalArgumentException, DateTime.TimeZone>(
    (locale: string, _ctx: Rx.Context): Effect.Effect<DateTime.TimeZone, Cause.IllegalArgumentException, never> =>
        Function.pipe(
            DateTime.zoneMakeNamed(locale),
            Either.fromOption(() => new Cause.IllegalArgumentException("Invalid timezone"))
        ),
    {
        /**
         * Default timezone is UTC because this could be on the server if in an
         * SSR context? So we might not know the users timezone. Also, we
         * wouldn't be able to set an initial value for from and until because
         * what timezone would this be then?
         */
        // initialValue: DateTime.zoneMakeNamed("UTC").pipe(Option.getOrElse(DateTime.zoneMakeLocal)),
    }
);

/**
 * "fromRx" tracks the start of the time range that the user has selected. When
 * setting this value, the attached timezone is ignored and the timezone from
 * the "localeRx" is attached instead. This is because this time should always
 * be set using the calendar component, where the user is supplying the exact
 * time they want in the locale they have selected. So it makes sense to ignore
 * any timezone and the local timezone and just attach the users selected
 * timezone instead.
 */
export const fromRx = Rx.fn<Date | DateTime.DateTime | undefined, Cause.IllegalArgumentException, DateTime.Zoned>(
    (
        input: Date | DateTime.DateTime | undefined,
        ctx: Rx.Context
    ): Effect.Effect<DateTime.Zoned, Cause.IllegalArgumentException, never> =>
        Effect.gen(function* () {
            const locale = yield* ctx.result(localeRx);
            const setZone = DateTime.setZone(locale);
            const now = yield* DateTime.now;

            const datetime = Function.pipe(
                Match.value(input),
                Match.when(Predicate.isDate, (d) => DateTime.make(d)),
                Match.when(DateTime.isDateTime, (d) => Option.some(d)),
                Match.when(Predicate.isUndefined, (_) => Option.some(now)),
                Match.exhaustive
            );

            if (Option.isNone(datetime)) {
                return yield* Effect.fail(new Cause.IllegalArgumentException("Invalid date"));
            }

            return setZone(datetime.value);
        }),
    {
        /** Default is 72 hours ago. */
        // Can't do this here because it will cause hydration warning and client rerenders.
        // initialValue: Function.pipe(
        //     Effect.runSync(DateTime.now),
        //     DateTime.subtractDuration(Duration.hours(72)),
        //     DateTime.setZone(DateTime.zoneMakeNamed("UTC").pipe(Option.getOrElse(DateTime.zoneMakeLocal)))
        // ),
    }
);

/**
 * "untilRx" tracks the end of the time range that the user has selected. When
 * setting this value, the attached timezone is ignored and the timezone from
 * the "localeRx" is attached instead. This is because this time should always
 * be set using the calendar component, where the user is supplying the exact
 * time they want in the locale they have selected. So it makes sense to ignore
 * any timezone and the local timezone and just attach the users selected
 * timezone instead.
 */
export const untilRx = Rx.fn<Date | DateTime.DateTime | undefined, Cause.IllegalArgumentException, DateTime.Zoned>(
    (
        input: Date | DateTime.DateTime | undefined,
        ctx: Rx.Context
    ): Effect.Effect<DateTime.Zoned, Cause.IllegalArgumentException, never> =>
        Effect.gen(function* () {
            const locale = yield* ctx.result(localeRx);
            const setZone = DateTime.setZone(locale);
            const now = yield* DateTime.now;

            const datetime = Function.pipe(
                Match.value(input),
                Match.when(Predicate.isDate, (d) => DateTime.make(d)),
                Match.when(DateTime.isDateTime, (d) => Option.some(d)),
                Match.when(Predicate.isUndefined, (_) => Option.some(now)),
                Match.exhaustive
            );

            if (Option.isNone(datetime)) {
                return yield* Effect.fail(new Cause.IllegalArgumentException("Invalid date"));
            }

            return setZone(datetime.value);
        }),
    {
        /** Default is now. */
        // Can't do this here because it will cause hydration warning and client rerenders.
        // initialValue: Function.pipe(
        //     Effect.runSync(DateTime.now),
        //     DateTime.subtractDuration(Duration.millis(0)),
        //     DateTime.setZone(DateTime.zoneMakeNamed("UTC").pipe(Option.getOrElse(DateTime.zoneMakeLocal)))
        // ),
    }
);

/**
 * "includeEmptyBucketsRx" tracks whether or not to include empty buckets in the
 * time series data.
 */
export const includeEmptyBucketsRx = Rx.make<true | false>(false);

/** "activeLabelRx" tracks the currently selected label. */
export const activeLabelRx = Rx.make<string | undefined>(undefined);

/**
 * "aggregateByRx" tracks the time unit that the user has selected to aggregate
 * the time series data by.
 */
export const aggregateByRx = Rx.make<Exclude<DateTime.DateTime.UnitPlural, "millis">>("seconds");

/** "steps2queryRx" tracks the list of pipeline steps to show in the graphs. */
export const steps2queryRx = Rx.make<HashSet.HashSet<string>>(HashSet.empty());

// ------------------------------------------------------------
//            Composed Rx's for pipeline health page
// ------------------------------------------------------------

/** Fetches all the rows from the database in the time range. */
export const rowsRx: Rx.Rx<Result.Result<Array<ResultRow>, Cause.IllegalArgumentException>> = runtime.rx(
    (
        ctx: Rx.Context
    ): Effect.Effect<Array<ResultRow>, Cause.IllegalArgumentException, RpcClient.Protocol | Scope.Scope> =>
        Effect.Do.pipe(
            Effect.bind("from", () => ctx.result(fromRx).pipe(Effect.map(DateTime.toUtc))),
            Effect.bind("until", () => ctx.result(untilRx).pipe(Effect.map(DateTime.toUtc))),
            Effect.bind("client", () => RpcClient.make(DatabaseRpcs)),
            Effect.flatMap(({ client, from, until }) => client.RunsInTimeRangeRequest({ from, until })),
            Effect.map(Record.values),
            Effect.map(Array.flatten),
            Effect.map(Array.filter(({ pipelineStep }) => HashSet.has(ctx.get(steps2queryRx), pipelineStep)))
        )
);

/** Computes the success rate, failure rate, and total number of runs. */
export const totalsRx: Rx.Rx<
    Result.Result<
        {
            failedRuns: number;
            successfulRuns: number;
            successRate: number;
            failureRate: number;
            totalRuns: number;
        },
        Cause.IllegalArgumentException
    >
> = runtime.rx(
    (
        ctx: Rx.Context
    ): Effect.Effect<
        { failedRuns: number; successfulRuns: number; successRate: number; failureRate: number; totalRuns: number },
        Cause.IllegalArgumentException,
        never
    > =>
        Effect.gen(function* () {
            const rows = yield* ctx.result(rowsRx);
            const total = rows.length;
            const [failures, successes] = Array.partition(rows, ({ success }) => success);
            const failureRate = Number.divide(failures.length, total).pipe(Option.getOrElse(() => 0)) * 100;
            const successRate = Number.divide(successes.length, total).pipe(Option.getOrElse(() => 0)) * 100;
            return {
                failedRuns: failures.length,
                successfulRuns: successes.length,
                successRate,
                failureRate,
                totalRuns: total,
            };
        })
);

/** Computes the average processing time for successful and failed runs. */
export const timeSeriesGroupedRx: Rx.Rx<
    Result.Result<
        Record<
            string,
            {
                threshold: number;
                avgFailTime: number;
                avgSuccessTime: number;
                entries: Array<ResultRow>;
                numberFailedRuns: number;
                numberSuccessfulRuns: number;
            }
        >,
        Cause.IllegalArgumentException
    >
> = runtime.rx(
    (
        ctx: Rx.Context
    ): Effect.Effect<
        Record<
            string,
            {
                threshold: number;
                avgFailTime: number;
                avgSuccessTime: number;
                entries: Array<ResultRow>;
                numberFailedRuns: number;
                numberSuccessfulRuns: number;
            }
        >,
        Cause.IllegalArgumentException,
        never
    > =>
        Effect.gen(function* () {
            const from = yield* ctx.result(fromRx);
            const until = yield* ctx.result(untilRx);
            const rows = yield* ctx.result(rowsRx);
            const unit = ctx.get(aggregateByRx);
            const includeEmptyBuckets = ctx.get(includeEmptyBucketsRx);

            const zeroOutParts: (
                u: Exclude<DateTime.DateTime.UnitPlural, "millis">
            ) => (d: DateTime.DateTime) => DateTime.DateTime = Function.pipe(
                Match.type<Exclude<DateTime.DateTime.UnitPlural, "millis">>(),
                Match.when("seconds", () => DateTime.setPartsUtc({ millis: 0 })),
                Match.when("minutes", () => DateTime.setPartsUtc({ millis: 0, seconds: 0 })),
                Match.when("hours", () => DateTime.setPartsUtc({ millis: 0, seconds: 0, minutes: 0 })),
                Match.when("days", () => DateTime.setPartsUtc({ millis: 0, seconds: 0, minutes: 0, hours: 0 })),
                Match.when("weeks", () => DateTime.setPartsUtc({ millis: 0, seconds: 0, minutes: 0, hours: 0 })),
                Match.when("months", () => DateTime.setPartsUtc({ millis: 0, seconds: 0, minutes: 0, hours: 0 })),
                Match.when("years", () => DateTime.setPartsUtc({ millis: 0, seconds: 0, minutes: 0, hours: 0 })),
                Match.exhaustive
            );

            const zeroBy = zeroOutParts(unit);
            const iterateBy = DateTime.add({ [unit]: 1 });
            const assignmentFunction = (row: ResultRow) => zeroBy(row.date);
            const groupingFunc = Function.compose(assignmentFunction, DateTime.formatIso);
            const groups = Array.groupBy(rows, groupingFunc);

            const groupsWithAverages = Record.map(groups, (group) => {
                const [failures, successes] = Array.partition(group, ({ success }) => success);
                const cumFailTim = Number.sumAll(Array.map(failures, ({ processingTime }) => processingTime));
                const cumSuccessTime = Number.sumAll(Array.map(successes, ({ processingTime }) => processingTime));
                const avgFailTime = Number.divide(cumFailTim, failures.length).pipe(Option.getOrElse(() => 0));
                const avgSuccessTime = Number.divide(cumSuccessTime, successes.length).pipe(Option.getOrElse(() => 0));
                return {
                    avgFailTime,
                    avgSuccessTime,
                    threshold: 30,
                    entries: group,
                    numberFailedRuns: successes.length,
                    numberSuccessfulRuns: failures.length,
                };
            });

            const emptyBucket = {
                threshold: 30,
                avgFailTime: 0,
                avgSuccessTime: 0,
                entries: Array.empty<ResultRow>(),
                numberFailedRuns: 0,
                numberSuccessfulRuns: 0,
            };

            if (!includeEmptyBuckets) {
                return groupsWithAverages;
            }

            const buckets = yield* Function.pipe(
                Stream.iterate(from, iterateBy),
                Stream.takeWhile(DateTime.lessThanOrEqualTo(until)),
                Stream.run(Sink.collectAll()),
                Effect.map(Chunk.toReadonlyArray),
                Effect.map(Array.sort(DateTime.Order)),
                Effect.timeout(Duration.seconds(5)),
                Effect.orDie
            );

            const bucketsWithAverages = Function.pipe(
                buckets,
                Array.map((bucketIdentifier) => {
                    const key = Function.compose(zeroBy, DateTime.formatIso)(bucketIdentifier);
                    const group = Record.get(groupsWithAverages, key).pipe(Option.getOrElse(() => emptyBucket));
                    return [key, group] as const;
                }),
                Record.fromEntries
            );

            return bucketsWithAverages;
        })
);

/**
 * Formats the time series data into a format that can be displayed in the
 * table.
 */
export const tableDataRx: Rx.Rx<
    Result.Result<
        Array<{
            file:
                | `${string}telescope_g_${string}_${string}_${number}_${string}.fits`
                | `${string}telescope_r_${string}_${string}_${number}_${string}.fits`;
            message: string;
            run: DateTime.Utc;
            processingTime: number;
            schemaName: typeof SchemaName.Encoded;
            pipelineStepName: string & Brand.Brand<"pipelineStep">;
            description: string;
        }>,
        Cause.IllegalArgumentException
    >
> = runtime.rx(
    (
        ctx: Rx.Context
    ): Effect.Effect<
        Array<{
            file:
                | `${string}telescope_g_${string}_${string}_${number}_${string}.fits`
                | `${string}telescope_r_${string}_${string}_${number}_${string}.fits`;
            message: string;
            run: DateTime.Utc;
            processingTime: number;
            schemaName: typeof SchemaName.Encoded;
            pipelineStepName: string & Brand.Brand<"pipelineStep">;
            description: string;
        }>,
        Cause.IllegalArgumentException,
        never
    > =>
        Effect.gen(function* () {
            const activeLabel = ctx.get(activeLabelRx);
            const timeSeriesData = yield* ctx.result(timeSeriesGroupedRx);

            const selectedRows = Function.pipe(
                timeSeriesData,
                Record.get(activeLabel ?? ""),
                Option.getOrElse(() => ({ entries: Array.empty<ResultRow>() })),
                ({ entries }) => entries
            );

            const withShortNames = Array.map(selectedRows, (row) => ({
                run: row.date,
                file: row.filePath,
                message: row.completion,
                schemaName: row.sourceTable,
                processingTime: row.processingTime,
                pipelineStepName: row.pipelineStep,
                description: row.description,
            }));

            return withShortNames;
        })
);
