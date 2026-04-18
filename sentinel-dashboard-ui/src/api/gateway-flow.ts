import { get, post, postWithParams } from "./client";
import type { Result } from "./types";
import type { GatewayFlowRule } from "@/types/gateway";

export function getGatewayFlowList(app: string, ip: string, port: number): Promise<Result<GatewayFlowRule[]>> {
  return get("gateway/flow/list.json", { app, ip, port });
}

export function addGatewayFlowRule(rule: GatewayFlowRule): Promise<Result<null>> {
  return post("gateway/flow/new.json", rule);
}

export function updateGatewayFlowRule(rule: GatewayFlowRule): Promise<Result<null>> {
  return post("gateway/flow/save.json", rule);
}

export function deleteGatewayFlowRule(id: number): Promise<Result<null>> {
  return postWithParams("gateway/flow/delete.json", { id });
}
