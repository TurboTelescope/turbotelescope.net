"use client";

import { useRxSet, useRxSuspenseSuccess, useRxValue } from "@effect-rx/rx-react";
import { DateTime, Function, Match, Duration, Effect } from "effect";
import { Result } from "@effect-rx/rx-react";
import { useMemo } from "react";

import { aggregateByRx, fromRx, localeRx, untilRx } from "@/components/PipelineHealth/rx";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { cn } from "@/lib/utils";

export function FromUntilRange() {
    // Gets
    const from = useRxValue(fromRx).pipe(
  Result.getOrElse(() =>
    Effect.runSync(
      Effect.gen(function* () {
        const now = yield* DateTime.now;
        const aWeekAgo = DateTime.subtractDuration(now, Duration.days(7));
        return aWeekAgo;
      })
    )
  )
);
    const until = useRxSuspenseSuccess(untilRx).value;
    const locale = useRxSuspenseSuccess(localeRx).value;
    const aggregation = useRxValue(aggregateByRx);

    // Sets
    const updateFrom = useRxSet(fromRx);
    const updateUntil = useRxSet(untilRx);

    // Memos
    const granularity = useMemo(
        () =>
            Function.pipe(
                Match.value(aggregation),
                Match.when("days", () => "day" as const),
                Match.when("hours", () => "hour" as const),
                Match.when("minutes", () => "minute" as const),
                Match.when("seconds", () => "second" as const),
                Match.orElse(() => undefined)
            ),
        [aggregation]
    );

    return (
        <div className={cn("grid grid-cols-2 gap-2")}>
            <DateTimePicker
                yearRange={3}
                className="w-72"
                placeholder="from"
                granularity={granularity}
                value={DateTime.toDateUtc(from)}
                timezone={DateTime.zoneToString(locale)}
                onChange={(date) => updateFrom(date)}
            />
            <DateTimePicker
                yearRange={3}
                className="w-72"
                placeholder="until"
                granularity={granularity}
                value={DateTime.toDateUtc(until)}
                timezone={DateTime.zoneToString(locale)}
                onChange={(date) => updateUntil(date)}
            />
        </div>
    );
}
