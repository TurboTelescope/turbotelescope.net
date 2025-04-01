"use client";

import { Result, Rx, useRxInitialValues, useRxValue } from "@effect-rx/rx-react";
import { Cause, DateTime, Exit, Function } from "effect";
import { Suspense } from "react";

import { AggregateBySelector } from "@/components/PipelineHealth/AggregateBySelector";
import { EmptyBucketsToggle } from "@/components/PipelineHealth/EmptyBucketsToggle";
import { FromUntilRange } from "@/components/PipelineHealth/FromUntilRange";
import { LocaleSelector } from "@/components/PipelineHealth/LocaleSelector";
import { PipelineStepHistogram } from "@/components/PipelineHealth/PipelineStepHistogram";
import { AverageProcessingTimeLineChart } from "@/components/PipelineHealth/RunTimeHist";
import { Steps2querySelector } from "@/components/PipelineHealth/StepsFilter";
import { RunsTable } from "@/components/PipelineHealth/Table";
import { fromRx, localeRx, totalsRx, untilRx } from "@/components/PipelineHealth/rx";

export function PipelineHealth({
    serverFrom,
    serverUntil,
    timezone,
}: {
    serverFrom: string;
    serverUntil: string;
    timezone: string;
}) {
    // Hydration
    useRxInitialValues([
        Rx.initialValue(
            localeRx,
            Function.pipe(
                DateTime.zoneFromString(timezone),
                Exit.fromOption,
                Exit.mapError(() => new Cause.IllegalArgumentException("Invalid timezone from server")),
                Result.fromExit
            )
        ),
        Rx.initialValue(
            fromRx,
            Function.pipe(
                DateTime.makeZonedFromString(serverFrom),
                Exit.fromOption,
                Exit.mapError(() => new Cause.IllegalArgumentException("Invalid serverFrom from server")),
                Result.fromExit
            )
        ),
        Rx.initialValue(
            untilRx,
            Function.pipe(
                DateTime.makeZonedFromString(serverUntil),
                Exit.fromOption,
                Exit.mapError(() => new Cause.IllegalArgumentException("Invalid serverUntil from server")),
                Result.fromExit
            )
        ),
    ]);

    // Gets
    const from = useRxValue(fromRx).pipe(Result.getOrThrow);
    const until = useRxValue(untilRx).pipe(Result.getOrThrow);
    const totals = useRxValue(totalsRx).pipe(
        Result.getOrElse(() => ({
            successRate: 0,
            failureRate: 0,
            totalRuns: 0,
        }))
    );

    return (
        <Suspense>
            <div className="flex justify-center my-4">
                <div className="mx-1">
                    <FromUntilRange />
                </div>
                <div className="mx-1">
                    <AggregateBySelector />
                </div>
                <div className="mx-1">
                    <EmptyBucketsToggle />
                </div>
                <div className="mx-1">
                    <LocaleSelector />
                </div>
                <div className="mx-1">
                    <Steps2querySelector />
                </div>
            </div>
            <span className="flex justify-center my-4 text-sm text-muted-foreground">
                Selected{" "}
                {Array.isArray(totals) ? totals.reduce((sum, item) => sum + item.totalRuns, 0) : totals.totalRuns}{" "}
                images between {DateTime.formatIsoZoned(from)} and {DateTime.formatIsoZoned(until)}
            </span>

            <div className="my-2 mx-2">
                <AverageProcessingTimeLineChart />
            </div>
            <div className="my-2 mx-2">
                <PipelineStepHistogram />
            </div>
            <div className="my-2 mx-2">
                <RunsTable />
            </div>
        </Suspense>
    );
}
