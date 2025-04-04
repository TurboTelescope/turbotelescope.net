/**
 * The steps filter determines which steps are shown on the step bar chart. It
 * is a dropdown menu that allows the user to select, from the list of short
 * pipeline step names, which steps to query. The filtering is applied client
 * side, so the user can see the results of their selection immediately without
 * needing to requery from the database.
 */

"use client";

import { useRx } from "@effect-rx/rx-react";
import { HashSet, Schema } from "effect";

import { steps2queryRx } from "@/components/PipelineHealth/rx";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PipelineStepName, ShortPipelineName } from "@/services/Domain";

export function Steps2querySelector() {
    const [steps2query, setSteps2query] = useRx(steps2queryRx);

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
                        setSteps2query(HashSet.fromIterable(PipelineStepName.literals));
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
                {ShortPipelineName.to.literals.map((shortName, i) => {
                    const longName = Schema.encodeSync(ShortPipelineName)(shortName);
                    return (
                        <DropdownMenuCheckboxItem
                            key={i}
                            checked={HashSet.has(steps2query, longName)}
                            onSelect={(event) => event.preventDefault()}
                            onCheckedChange={(checked) => {
                                if (checked == true) {
                                    setSteps2query(HashSet.add(steps2query, longName));
                                } else {
                                    setSteps2query(HashSet.remove(steps2query, longName));
                                }
                            }}
                        >
                            {shortName}
                        </DropdownMenuCheckboxItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
