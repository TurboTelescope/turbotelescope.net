"use client";

import { useRxSuspenseSuccess, useRxValue } from "@effect-rx/rx-react";
import { DateTime, HashSet } from "effect";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

import { steps2queryRx, tableDataRx } from "@/components/PipelineHealth/rx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { splitLiteral } from "@/services/Domain";

export const getSciURL = (filePath: string): string => {
    const start = filePath.indexOf("telescope_");
    const end = filePath.lastIndexOf(".fits");

    if (start !== -1 && end !== -1 && end > start) {
        const ImgName = filePath.substring(start + "telescope_".length, end);
        return "http://popcorn.spa.umn.edu/center_cutouts/sci_cutouts/centcut_telescope_" + ImgName + ".webp";
    } else {
        return "http://popcorn.spa.umn.edu/center_cutouts/sci_cutouts/error";
    }
};

export const getDiffURL = (filePath: string): string => {
    const start = filePath.indexOf("telescope_");
    const end = filePath.lastIndexOf(".fits");

    if (start !== -1 && end !== -1 && end > start) {
        const ImgName = filePath.substring(start + "telescope_".length, end);
        return "http://popcorn.spa.umn.edu/center_cutouts/diff_cutouts/diff_centcut_telescope_" + ImgName + ".webp";
    } else {
        return "http://popcorn.spa.umn.edu/center_cutouts/sci_cutouts/error";
    }
};

//M82 ref is differnt from all other ref types.pipe(
//others: "name_number", i.e. IC_1613"
//M82: "M82"
export const getRefURL = (
    filePath:
        | `${string}telescope_g_${string}_${string}_${number}_${string}.fits`
        | `${string}telescope_r_${string}_${string}_${number}_${string}.fits`
): string => {
    const test = splitLiteral(filePath, "telescope_")[1];
    const [redOrGreen, a, b] = splitLiteral(test, "_");
    if (b == "2025" || b == "2024") {
        return (
            "http://popcorn.spa.umn.edu/center_cutouts/ref_cutouts/ref_centcut_telescope_" +
            redOrGreen +
            "_" +
            a +
            ".webp"
        );
    }
    return (
        "http://popcorn.spa.umn.edu/center_cutouts/ref_cutouts/ref_centcut_telescope_" +
        redOrGreen +
        "_" +
        a +
        b +
        ".webp"
    );
};
//{/* {row.status == "Yes" ? "View Image" : ""} */}
//Sci
export function RunsTable() {
    const tableData = useRxSuspenseSuccess(tableDataRx).value;
    const steps2query = useRxValue(steps2queryRx);
    const filterTableData = tableData.filter(({ pipelineStepName }) => HashSet.has(steps2query, pipelineStepName));

    return (
        <Table>
            <TableCaption>All runs for {"activeLabel"}</TableCaption>
            <TableHeader>
                <TableRow>
                    <TableHead>Run</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Processing Time</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead className="text-right">Verbose logs</TableHead>
                    <TableHead>Cutout</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filterTableData.map((row, index) => (
                    <TableRow key={index}>
                        <TableCell className="font-medium">{DateTime.formatIso(row.run)}</TableCell>
                        <TableCell>{row.shortPipelineStepName}</TableCell>
                        <TableCell>{row.processingTime}</TableCell>
                        <TableCell>{row.file}</TableCell>
                        <TableCell>
                            <Link
                                href={{
                                    pathname: `/IHW/verbose-logs/${row.file.includes("tlenaii") ? "tlenaii" : "popcorn"}/${row.schemaName}`,
                                }}
                                target="_blank"
                            >
                                View logs
                            </Link>
                        </TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <ChevronDown />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <Link
                                        key={1}
                                        href={{
                                            pathname: getSciURL(row.file),
                                        }}
                                        target="_blank"
                                    >
                                        <DropdownMenuItem>
                                            {/* {row.status == "Yes" ? "View Image" : ""} */}
                                            Sci
                                        </DropdownMenuItem>
                                    </Link>

                                    <Link
                                        key={2}
                                        href={{
                                            pathname: getSciURL(row.file),
                                        }}
                                        target="_blank"
                                    >
                                        <DropdownMenuItem>
                                            {/* {row.status == "Yes" ? "View Image" : ""} */}
                                            Diff
                                        </DropdownMenuItem>
                                    </Link>

                                    <Link
                                        key={3}
                                        href={{
                                            pathname: getSciURL(row.file),
                                        }}
                                        target="_blank"
                                    >
                                        <DropdownMenuItem>
                                            {/* {row.status == "Yes" ? "View Image" : ""} */}
                                            Ref
                                        </DropdownMenuItem>
                                    </Link>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
