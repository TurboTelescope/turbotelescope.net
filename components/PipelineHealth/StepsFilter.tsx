/**
 * The steps filter determines which steps are shown on the step bar chart. It
 * is a dropdown menu that allows the user to select, from the list of short
 * pipeline step names, which steps to query. The filtering is applied client
 * side, so the user can see the results of their selection immediately without
 * needing to requery from the database.
 */

"use client";

import { Result, useRx, useRxValue } from "@effect-rx/rx-react";
import { Array, Function, HashSet, Record } from "effect";

import { steps2queryRx, tableDataRx } from "@/components/PipelineHealth/rx";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Steps2querySelector() {
    const tableData = useRxValue(tableDataRx).pipe(Result.getOrThrow);
    const [steps2query, setSteps2query] = useRx(steps2queryRx);

    const a = Array.groupBy(tableData, (row) => row.pipelineStepName);

    const allPipelineStepNames = Function.pipe(
        Record.values(a),
        Array.map(([{ pipelineStepName }]) => pipelineStepName)
    );

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    <span>Filter steps</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
                <DropdownMenuItem
                    onSelect={(event) => {
                        event.preventDefault();
                        setSteps2query(HashSet.fromIterable(allPipelineStepNames));
                    }}
                >
                    Select All
                </DropdownMenuItem>
                <DropdownMenuItem
                    onSelect={(event) => {
                        event.preventDefault();
                        setSteps2query(HashSet.empty());
                    }}
                >
                    Unselect All
                </DropdownMenuItem>
                {allPipelineStepNames.map((Name, i) => {
                    return (
                        <DropdownMenuCheckboxItem
                            key={i}
                            checked={HashSet.has(steps2query, Name)}
                            onSelect={(event) => event.preventDefault()}
                            onCheckedChange={(checked) => {
                                if (checked == true) {
                                    setSteps2query(HashSet.add(steps2query, Name));
                                } else {
                                    setSteps2query(HashSet.remove(steps2query, Name));
                                }
                            }}
                        >
                            {Name}
                        </DropdownMenuCheckboxItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
