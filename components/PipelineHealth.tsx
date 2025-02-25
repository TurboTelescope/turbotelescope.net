"use client";

import { Result, useRx, useRxSet, useRxValue } from "@effect-rx/rx-react";
import { DateTime, Duration, Effect } from "effect";
import { Suspense, useMemo } from "react";

import { AggregateBySelector } from "@/components/PipelineHealth/AggregateBySelector";
import { DatePickerWithRange } from "@/components/PipelineHealth/DatePickerRange";
import { EmptyBucketsToggle } from "@/components/PipelineHealth/EmptyBucketsToggle";
import { PipelineStepHistogram } from "@/components/PipelineHealth/PipelineStepHistogram";
import { AverageProcessingTimeLineChart } from "@/components/PipelineHealth/RunTimeHist";
import { RunsTable } from "@/components/PipelineHealth/Table";
import { fromRx, rowsRx, timeSeriesGroupedRx, totalsRx, untilRx } from "@/components/PipelineHealth/rx";
import { LocaleSelector } from "./PipelineHealth/LocaleSelector";
import { Steps2querySelector } from "./PipelineHealth/StepsFilter";

export function PipelineHealth() {
    // Sets
    const [_rows, pullRows] = useRx(rowsRx);
    useMemo(pullRows, [pullRows]);

    const pullTimeSeriesData = useRxSet(timeSeriesGroupedRx);
    useMemo(pullTimeSeriesData, [pullTimeSeriesData]);

    const updateFrom = useRxSet(fromRx);
    useMemo(
        () => updateFrom(Effect.runSync(DateTime.now).pipe(DateTime.subtractDuration(Duration.days(3)))),
        [updateFrom]
    );

    const updateUntil = useRxSet(untilRx);
    useMemo(() => updateUntil(Effect.runSync(DateTime.now)), [updateUntil]);

    // Gets
    const from = useRxValue(fromRx);
    const until = useRxValue(untilRx);
    const totals = useRxValue(totalsRx);

    // TODO: Error handling
    if (!Result.isSuccess(from) || !Result.isSuccess(until) || !Result.isSuccess(totals)) {
        return <p>Loading...</p>;
    }

    return (
        <>
            <div className="flex justify-center my-4">
                <div className="mx-1">
                    <DatePickerWithRange />
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
                Selected {totals.value.totalRuns} images between {DateTime.formatIsoZoned(from.value)} and{" "}
                {DateTime.formatIsoZoned(until.value)}
            </span>

            <Suspense fallback={<p>Loading...</p>}>
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
        </>
    );
}
