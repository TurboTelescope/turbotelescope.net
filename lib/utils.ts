import { SchemaName, splitLiteral, tail } from "@/services/Domain";
import { clsx, type ClassValue } from "clsx";
import { Function } from "effect";
import { twMerge } from "tailwind-merge";

const popcornServer = "http://popcorn-logs.turbotelescope.net:54321";
const tlenaiiServer = "http://tlenaii-logs.turbotelescope.net:54322";

export const cn = (...inputs: ReadonlyArray<ClassValue>) => twMerge(clsx(inputs));

export const getLogURL = (schemaName: typeof SchemaName.from.Type, machine: "tlenaii" | "popcorn"): string => {
    const splitAndDropFirst4 = Function.flow(splitLiteral, tail, tail, tail, tail);
    const [monthString, dayString, yearString, hoursString, minutesString, secondsString] = splitAndDropFirst4(
        schemaName,
        "_"
    );

    const timeParts =
        `${yearString}_${monthString}_${dayString}_${hoursString}_${minutesString}_${secondsString}` as const;

    const server = machine === "tlenaii" ? tlenaiiServer : popcornServer;
    const location = `Light_weight_pipeline_${timeParts}` as const;

    return server + "/" + location + "/" + "verbose_log.txt";
};
