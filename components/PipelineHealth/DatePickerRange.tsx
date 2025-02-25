"use client";

import { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function DatePickerWithRange({ className }: HTMLAttributes<HTMLDivElement>) {
    // const [from, updateFrom] = useRx(fromRx);
    // const [until, updateUntil] = useRx(untilRx);
    // const locale = useRxValue(localeRx).pipe(Result.getOrThrow);

    // const timezone = useMemo(() => DateTime.zoneToString(locale), [locale]);
    // const dates = useMemo(
    //     () => ({
    //         from: DateTime.toDate(Result.getOrThrow(from)),
    //         until: DateTime.toDate(Result.getOrThrow(until)),
    //     }),
    //     [from, until]
    // );

    return (
        <div className={cn("grid gap-2", className)}>
            {/* <DateTimePicker clearable={true} onChange={(x) => {}} value={dates.from} timeZone={timezone} />
            <DateTimePicker clearable={true} onChange={(x) => {}} value={dates.until} timeZone={timezone} /> */}
        </div>
    );
}
