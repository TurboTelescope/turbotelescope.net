/**
 * Aggregation determines at what interval the time series data is grouped by.
 * The time series data can be grouped by seconds, minutes, hours, days, months,
 * or years. The AggregateBySelector component is a dropdown menu that allows
 * the user to select the aggregation interval.
 *
 * Aggregation by seconds and minutes is disabled when include empty buckets is
 * enabled because otherwise the graph would be too dense / render poorly.
 *
 * TODO: I think aggregation by seconds and minutes does make sense so long as
 * the time range is small enough. A quantifiable metric might be the number of
 * resultant buckets, i.e if selecting seconds would result in more than N
 * buckets (where N is a threshold determined by testing until the graph renders
 * poorly) then disable it. This metric should be implemented by pulling in the
 * RowsRx, and taking all the keys from that map. The grouping function from the
 * RowsRx should be pulled out so that it could be reused here, and then the
 * same grouping logic should be applied here for each aggregation method,
 * disabling all aggregation methods that exceed the threshold.
 */

"use client";

import { useRx, useRxValue } from "@effect-rx/rx-react";

import { aggregateByRx, includeEmptyBucketsRx } from "@/components/PipelineHealth/rx";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AggregateBySelector() {
    // Gets
    const showEmptyBuckets = useRxValue(includeEmptyBucketsRx);

    // Sets
    const [aggregateBy, setAggregateBy] = useRx(aggregateByRx);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    <span>Aggregate by</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup
                    value={aggregateBy}
                    onValueChange={(str) =>
                        setAggregateBy(str as "seconds" | "minutes" | "hours" | "days" | "months" | "years")
                    }
                >
                    <DropdownMenuRadioItem value={"seconds"} disabled={showEmptyBuckets}>
                        Seconds{showEmptyBuckets && " (disabled)"}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value={"minutes"} disabled={showEmptyBuckets}>
                        Minutes{showEmptyBuckets && " (disabled)"}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value={"hours"}>Hours</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value={"days"}>Days</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value={"months"}>Months</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value={"years"}>Years</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
