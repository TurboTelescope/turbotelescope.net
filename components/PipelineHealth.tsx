"use client";

import { useRxSuspenseSuccess } from "@effect-rx/rx-react";
import { DateTime } from "effect";
import { Suspense } from "react";

import { AggregateBySelector } from "@/components/PipelineHealth/AggregateBySelector";
import { DatePickerWithRange } from "@/components/PipelineHealth/DatePickerRange";
import { EmptyBucketsToggle } from "@/components/PipelineHealth/EmptyBucketsToggle";
import { LocaleSelector } from "@/components/PipelineHealth/LocaleSelector";
import { PipelineStepHistogram } from "@/components/PipelineHealth/PipelineStepHistogram";
import { AverageProcessingTimeLineChart } from "@/components/PipelineHealth/RunTimeHist";
import { Steps2querySelector } from "@/components/PipelineHealth/StepsFilter";
import { RunsTable } from "@/components/PipelineHealth/Table";
import { fromRx, totalsRx, untilRx } from "@/components/PipelineHealth/rx";

export function PipelineHealth() {
    const from = useRxSuspenseSuccess(fromRx).value;
    const until = useRxSuspenseSuccess(untilRx).value;
    const totals = useRxSuspenseSuccess(totalsRx).value;

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
                Selected {totals.totalRuns} images between {DateTime.formatIsoZoned(from)} and{" "}
                {DateTime.formatIsoZoned(until)}
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
