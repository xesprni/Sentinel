import { get, post } from "./client";
import type { Result } from "./types";
import type { GatewayApiDefinition } from "@/types/gateway";

export function getGatewayApiList(app: string, ip?: string, port?: number): Promise<Result<GatewayApiDefinition[]>> {
  return get("gateway/api/list.json", { app, ...(ip && { ip }), ...(port && { port }) });
}

export function addGatewayApi(api: GatewayApiDefinition): Promise<Result<null>> {
  return post("gateway/api/new.json", api);
}

export function updateGatewayApi(api: GatewayApiDefinition): Promise<Result<null>> {
  return post("gateway/api/save.json", api);
}

export function deleteGatewayApi(id: number): Promise<Result<null>> {
  return post("gateway/api/delete.json", { id });
}
