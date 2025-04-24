"use client";

import { Rx, useRxSet } from "@effect-rx/rx-react";
import { FetchHttpClient } from "@effect/platform";
import { useMemo } from "react";

import { SchemaName } from "@/services/Domain";

const runtime = Rx.runtime(FetchHttpClient.layer);

const machineRx = Rx.make<"tlenaii" | "popcorn">("popcorn" as const);
const schemaNameRx = Rx.make<typeof SchemaName.from.Type>(
    "" as `science_turbo_production_pipeline_${number}_${number}_${number}_${number}_${number}_${number}`
);

// const verboseLogURLRx: Rx.Rx<Result.Result<string, never>> = runtime.rx(
//     (context: Rx.Context): Effect.Effect<string, never, HttpClient.HttpClient> =>
//         Effect.Do.pipe(
//             Effect.let("machine", () => context.get(machineRx)),
//             Effect.let("schemaName", () => context.get(schemaNameRx)),
//             Effect.let("request", ({ machine, schemaName }) => new VerboseLogURLRequest({ schemaName, machine })),
//             Effect.bind("client", () => rpcClient),
//             Effect.flatMap(({ client, request }) => client(request))
//         )
// );

export function LogViewer({
    machine,
    schemaName,
}: {
    machine: "tlenaii" | "popcorn";
    schemaName: typeof SchemaName.Encoded;
}) {
    // Sets
    const setMachineName = useRxSet(machineRx);
    const setSchemaName = useRxSet(schemaNameRx);
    useMemo(() => setMachineName(machine), [machine, setMachineName]);
    useMemo(() => setSchemaName(schemaName), [schemaName, setSchemaName]);

    // Suspenses
    // const verboseLogs = useRxSuspenseSuccess(verboseLogURLRx).value;

    // Content
    //const all = verboseLogs.items.map((item) => new TextDecoder().decode(item)).join("\n");

    // return <pre>{verboseLogs}</pre>;
    return <p></p>;
}
