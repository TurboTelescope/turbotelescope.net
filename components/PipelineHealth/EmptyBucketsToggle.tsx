/**
 * Empty buckets determines whether or not to show buckets that have no data.
 * This is useful for showing gaps in data, but is disabled by default for
 * performance reasons.
 *
 * When empty buckets are enable, after the data is aggregated, we will fill in
 * any missing buckets with empty data. The database service only returns the
 * raw data from the database and we apply this transformation and aggregation
 * on the client so that we don't have to refetch data when the user changes
 * this selection.
 *
 * If aggregation by seconds or minutes is enabled, empty buckets will be
 * disabled because the graph would be too dense and render poorly.
 *
 * TODO: I think showing empty buckets does make sense so long as the number of
 * buckets does not exceed a threshold that would cause the graph to render
 * poorly. This threshold could be determined through testing. A quantifiable
 * metric would be the number of buckets after aggregation is applied. See the
 * comment in AggregateBySelector.tsx for more details.
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

export function EmptyBucketsToggle() {
    // Gets
    const aggregateBy = useRxValue(aggregateByRx);

    // Sets
    const [showEmptyBuckets, setShowEmptyBuckets] = useRx(includeEmptyBucketsRx);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    <span>Show empty buckets</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup value={showEmptyBuckets.toString()}>
                    <DropdownMenuRadioItem value={"false"} onClick={() => setShowEmptyBuckets(false)}>
                        No
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                        value={"true"}
                        disabled={aggregateBy === "seconds" || aggregateBy === "minutes"}
                        onClick={() => setShowEmptyBuckets(true)}
                    >
                        Yes{(aggregateBy === "seconds" || aggregateBy === "minutes") && " (disabled)"}
                    </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
