"use client";
import { useRxSuspenseSuccess } from "@effect-rx/rx-react";
import { Array, Brand, Function, Record, Tuple } from "effect";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { rowsRx } from "@/components/PipelineHealth/rx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const chart1 = "pipelineFailure" as const;

export const chartConfigs = {
    [chart1]: {
        color: "hsl(var(--chart-1))",
        title: "Percent failure",
        label: "Failed Pipeline Steps",
    },
} satisfies ChartConfig;

export type MappedData = Array<{
    pipelineStep: string & Brand.Brand<"pipelineStep">;
    [chart1]: number;
}>;

export function PipelineStepHistogram() {
    const rows = useRxSuspenseSuccess(rowsRx).value;

    const chartData = Function.pipe(
        Array.partition(rows, ({ success }) => success),
        Tuple.getFirst,
        Array.groupBy(({ pipelineStep }) => pipelineStep),
        Record.map((rows, key) => ({ [chart1]: rows.length, pipelineStep: key })),
        Record.values
    );

    return (
        <Card>
            <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
                <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
                    <CardTitle>Pipeline Step Failures</CardTitle>
                    <CardDescription>Showing the number of failures at each Pipeline step</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="px-2 sm:p-6">
                <ChartContainer config={chartConfigs} className="aspect-auto h-[250px] w-full">
                    <BarChart
                        accessibilityLayer
                        data={chartData}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="pipelineStep"
                            tickLine={true}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(longName) => longName}
                        />
                        <YAxis tickLine={true} axisLine={false} tickMargin={8} tickFormatter={(value) => `${value}`} />
                        <ChartTooltip content={<ChartTooltipContent className="w-[275px]" />} />
                        <Bar dataKey={chart1} type="monotone" fill={"#0000FF"} fillOpacity={0.5} strokeWidth={2} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
