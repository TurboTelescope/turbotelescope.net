import { RpcSerialization, RpcServer } from "@effect/rpc";
import { Layer } from "effect";
import { NextRequest } from "next/server";

import { DatabaseRpcs } from "@/services/Domain";
import { Live } from "@/services/rpcs";
import { HttpServer } from "@effect/platform";

const { handler } = RpcServer.toWebHandler(DatabaseRpcs, {
    layer: Layer.mergeAll(RpcSerialization.layerJson, HttpServer.layerContext, Live),
});

export const POST = async (request: NextRequest) => handler(request);
