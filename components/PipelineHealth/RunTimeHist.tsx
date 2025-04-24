"use client";

import { useRxSet, useRxSuspenseSuccess, useRxValue } from "@effect-rx/rx-react";
import { CheckIcon, Cross2Icon } from "@radix-ui/react-icons";
import { DateTime, Function, Match, Option, Record } from "effect";
import { useMemo, useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, XAxis, YAxis } from "recharts";

import { activeLabelRx, aggregateByRx, timeSeriesGroupedRx, totalsRx } from "@/components/PipelineHealth/rx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { SigmaIcon } from "lucide-react";

const chart1 = "sumOfSuccessAndFail" as const;
const chart2 = "averageSuccessProcessingTime" as const;
const chart3 = "averageFailureProcessingTime" as const;
const chart4 = "numberOfSuccessfulRuns" as const;
const chart5 = "numberOfFailedRuns" as const;
const chart6 = "averageProcessingTimeAllRuns" as const;
const chart7 = "numberOfAllRuns" as const;

export const chartConfigs = {
    [chart1]: {
        label: "Total",
        title: "sum success fail",
        color: "#FFFFFF",
        icon: SigmaIcon,
    },
    [chart2]: {
        color: "#00cc00",
        title: "Percent success",
        label: "Average successful processing time",
        icon: CheckIcon,
    },
    [chart3]: {
        color: "#FF0000",
        title: "Percent failure",
        label: "Average failed processing time",
        icon: Cross2Icon,
    },
    [chart5]: {
        color: "#FF0000",
        title: "Images Unsuccessfully Processed",
        label: "Images Unsccessfully Processed",
        icon: Cross2Icon,
    },
    [chart4]: {
        color: "#00cc00",
        title: "Images Successfully Processed",
        label: "Images Successfully Processed",
        icon: CheckIcon,
    },
    [chart6]: {
        color: "#FFFFFF",
        title: "All Runs",
        label: "Average Processing Time",
    },
    [chart7]: {
        color: "#FFFFFF",
        title: "All Runs",
        label: "All Runs",
    },
} satisfies ChartConfig;

export type MappedData = Array<{
    date: string;
    [chart1]: number;
    [chart2]: number;
    [chart3]: number;
    [chart4]: number;
    [chart5]: number;
}>;

export function AverageProcessingTimeLineChart() {
    // Gets
    const aggregateBy = useRxValue(aggregateByRx);

    // Sets
    const setActiveLabel = useRxSet(activeLabelRx);
    const [activeChart, setActiveChart] = useState<"success" | "failure" | "all">("all");

    // Suspends
    const totals = useRxSuspenseSuccess(totalsRx).value;
    const timeSeriesData = useRxSuspenseSuccess(timeSeriesGroupedRx).value;

    // Data mapping
    const chartTotals = {
        [chart1]: `${totals.successfulRuns + totals.failedRuns}`,
        [chart2]: `${totals.successRate.toFixed(1)}%`,
        [chart3]: `${totals.failureRate.toFixed(1)}%`,
        [chart4]: `${totals.successfulRuns}`,
        [chart5]: `${totals.failedRuns}`,
        [chart6]: "Show All",
        [chart7]: `${totals.totalRuns}`,
    };
    const chartData: MappedData = Record.values(
        Record.map(timeSeriesData, ({ avgFailTime, avgSuccessTime, numberFailedRuns, numberSuccessfulRuns }, key) => ({
            date: key,
            [chart1]: numberFailedRuns + numberSuccessfulRuns,
            [chart2]: avgSuccessTime,
            [chart3]: avgFailTime,
            [chart4]: numberFailedRuns,
            [chart5]: numberSuccessfulRuns,
        }))
    );
    const activeChartKey = activeChart === "all" ? chart7 : activeChart === "success" ? chart4 : chart5;

    //dynamically updates chart x-axis based on aggregate by selection
    const XaxisTickFormatter: (self: DateTime.DateTime) => string = useMemo(
        () =>
            Function.pipe(
                Match.value(aggregateBy),
                Match.when("years", () => DateTime.formatUtc({ locale: "en-US", year: "numeric" })),
                Match.when("months", () => DateTime.formatUtc({ locale: "en-US", month: "long", year: "numeric" })),
                Match.when("days", () => DateTime.formatUtc({ locale: "en-US", month: "short", day: "numeric" })),
                Match.when("hours", () =>
                    DateTime.formatUtc({ locale: "en-US", month: "short", day: "numeric", hour: "numeric" })
                ),
                Match.when("minutes", () =>
                    DateTime.formatUtc({
                        locale: "en-US",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                    })
                ),
                Match.when("seconds", () =>
                    DateTime.formatUtc({
                        locale: "en-US",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                        second: "numeric",
                    })
                ),
                Match.orElse(() => DateTime.formatUtc({ locale: "en-US", month: "short", day: "numeric" }))
            ),
        [aggregateBy]
    );

    // Chart implementation
    return (
        <Card>
            <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
                <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
                    <CardTitle>
                        Showing{" "}
                        {activeChart === "success"
                            ? "the Number of Successfully"
                            : activeChart === "failure"
                              ? "the Number of Unsuccessfully"
                              : "All"}{" "}
                        Processed Images Grouped by {aggregateBy}
                    </CardTitle>

                    <span className="text-xs text-muted-foreground">
                        {chartConfigs[chart2].title} = {chartTotals[chart2]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {chartConfigs[chart3].title} = {chartTotals[chart3]}
                    </span>
                    <span className="text-xs text-muted-foreground">Total Number of Runs = {chartTotals[chart7]}</span>
                </div>
                <div className="flex">
                    {[chart4, chart5, chart6].map((chart) => {
                        return (
                            <button
                                key={chart}
                                data-active={chart.toLocaleLowerCase().includes(activeChart)}
                                className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                                onClick={() =>
                                    chart === "averageProcessingTimeAllRuns"
                                        ? setActiveChart("all")
                                        : chart === "numberOfSuccessfulRuns"
                                          ? setActiveChart("success")
                                          : setActiveChart("failure")
                                }
                            >
                                <span className="text-xs text-muted-foreground">{chartConfigs[chart].title}</span>
                                <span className="text-lg font-bold leading-none sm:text-3xl">{chartTotals[chart]}</span>
                            </button>
                        );
                    })}
                </div>
            </CardHeader>
            <CardContent className="px-2 sm:p-6">
                <ChartContainer config={chartConfigs} className="aspect-auto h-[350px] w-full">
                    <ComposedChart
                        onClick={(event) => setActiveLabel(event.activeLabel)}
                        accessibilityLayer
                        data={chartData}
                        margin={{
                            left: 12,
                            right: 12,
                            bottom: aggregateBy === "seconds" || aggregateBy === "minutes" ? 70 : 40,
                        }}
                    >
                        <CartesianGrid />
                        <XAxis
                            dataKey="date"
                            tickLine={true}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                            angle={aggregateBy === "seconds" || aggregateBy === "minutes" ? -45 : 0}
                            textAnchor={aggregateBy === "seconds" || aggregateBy === "minutes" ? "end" : "middle"}
                            tickFormatter={Function.flow(DateTime.make, Option.getOrThrow, XaxisTickFormatter)}
                        />
                        <YAxis tickLine={true} axisLine={false} tickMargin={8} tickFormatter={(value) => `${value}`} />

                        <ChartTooltip
                            includeHidden
                            payloadUniqBy={({ dataKey }) => dataKey}
                            content={
                                <ChartTooltipContent
                                    className="w-[300px]"
                                    labelFormatter={Function.flow(
                                        DateTime.make,
                                        Option.getOrThrow,
                                        DateTime.formatUtc({
                                            locale: "en-US",
                                            second: "numeric",
                                            minute: "numeric",
                                            hour: "numeric",
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })
                                    )}
                                />
                            }
                        />
                        <Legend
                            payload={
                                activeChartKey === "numberOfAllRuns"
                                    ? [
                                          {
                                              id: "numberOfFailedRuns",
                                              type: "square",
                                              value: chartConfigs["numberOfFailedRuns"].label,
                                              color: chartConfigs["numberOfFailedRuns"].color,
                                          },
                                          {
                                              id: "numberOfSuccessfulRuns",
                                              type: "square",
                                              value: chartConfigs["numberOfSuccessfulRuns"].label,
                                              color: chartConfigs["numberOfSuccessfulRuns"].color,
                                          },
                                      ]
                                    : [
                                          {
                                              id: activeChartKey,
                                              type: "square",
                                              value: chartConfigs[activeChartKey].label,
                                              color: chartConfigs[activeChartKey].color,
                                          },
                                      ]
                            }
                            verticalAlign="top"
                            align="left"
                            height={36}
                        />

                        {activeChart === "all" ? (
                            <Bar
                                key={`${chart7}.${chart4}-bar`}
                                dataKey={`${chart4}`}
                                type="monotone"
                                fill={`var(--color-${chart4})`}
                                fillOpacity={0.5}
                            />
                        ) : (
                            <></>
                        )}
                        {activeChart === "all" ? (
                            <Bar
                                key={`${chart7}.${chart5}-bar`}
                                dataKey={`${chart5}`}
                                type="monotone"
                                fill={`var(--color-${chart5})`}
                                fillOpacity={0.5}
                            />
                        ) : (
                            <></>
                        )}

                        {activeChart !== "all" ? (
                            <Bar
                                key={activeChart === "success" ? `${chart4}-bar` : `${chart5}-bar`}
                                dataKey={activeChart === "success" ? chart4 : chart5}
                                type="monotone"
                                fill={`var(--color-${activeChart === "success" ? chart4 : chart5})`}
                                fillOpacity={0.5}
                            />
                        ) : (
                            <></>
                        )}

                        {activeChart === "all" ? (
                            <Line
                                dataKey={chart1}
                                type="monotone"
                                stroke={`var(--color-${chart1})`}
                                strokeWidth={1}
                                strokeDasharray={"3 3"}
                                dot={false}
                                hide={true}
                            />
                        ) : (
                            <></>
                        )}

                        {/* Enables Chart of Hover based on active chart */}
                        {activeChart === "success" ? (
                            <Line dataKey={chart2} hide />
                        ) : activeChart === "failure" ? (
                            <Line dataKey={chart3} hide />
                        ) : activeChart === "all" ? (
                            <Line dataKey={chart7} hide />
                        ) : null}
                    </ComposedChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
