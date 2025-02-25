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
                    <span>Select Steps to Query</span>
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
                            checked={HashSet.has(steps2query, shortName)}
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
