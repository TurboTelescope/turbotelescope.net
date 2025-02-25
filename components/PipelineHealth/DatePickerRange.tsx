"use client";

import { Result, useRx, useRxValue } from "@effect-rx/rx-react";
import { DateTime } from "effect";
import { HTMLAttributes, useMemo } from "react";

import { fromRx, localeRx, untilRx } from "@/components/PipelineHealth/rx";
import { cn } from "@/lib/utils";

export function DatePickerWithRange({ className }: HTMLAttributes<HTMLDivElement>) {
    const [from, updateFrom] = useRx(fromRx);
    const [until, updateUntil] = useRx(untilRx);
    const locale = useRxValue(localeRx).pipe(Result.getOrThrow);

    const dates = useMemo(
        () => ({
            from: DateTime.toDate(Result.getOrThrow(from)),
            until: DateTime.toDate(Result.getOrThrow(until)),
        }),
        [from, until]
    );

    const timezone = useMemo(() => DateTime.zoneToString(locale), [locale]);
    console.log(timezone);
    console.log(dates);

    return (
        <div className={cn("grid gap-2", className)}>
            {/* <DateTimePicker clearable={true} onChange={(x) => {}} value={dates.from} timeZone={timezone} />
            <DateTimePicker clearable={true} onChange={(x) => {}} value={dates.until} timeZone={timezone} /> */}
        </div>
    );
}
