import { get, post, put, del } from "./client";
import type { Result } from "./types";
import type { FlowRule } from "@/types/rule";

export function getFlowRules(app: string, ip?: string, port?: number): Promise<Result<FlowRule[]>> {
  return get("v1/flow/rules", { app, ...(ip && { ip }), ...(port && { port }) });
}

export function addFlowRule(rule: FlowRule): Promise<Result<null>> {
  return post("v1/flow/rule", rule);
}

export function updateFlowRule(rule: FlowRule): Promise<Result<null>> {
  return put("v1/flow/save.json", rule);
}

export function deleteFlowRule(id: number): Promise<Result<null>> {
  return del("v1/flow/delete.json", { id });
}
