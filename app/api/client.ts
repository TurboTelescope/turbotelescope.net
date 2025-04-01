import type { RpcRouter } from "@/app/api/route";
import * as Resolver from "@effect/rpc-http/HttpRpcResolver";

export const rpcClient = Resolver.makeClient<RpcRouter>(`${process.env.NEXT_PUBLIC_URL}/api`);
