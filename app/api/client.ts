import type { RpcRouter } from "@/app/api/route";
import * as Resolver from "@effect/rpc-http/HttpRpcResolver";

export const rpcClient = Resolver.makeClient<RpcRouter>("http://popcorn.spa.umn.edu:5002/api");
