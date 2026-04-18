import { get, post, put, del } from "./client";
import type { Result } from "./types";
import type { FlowRule } from "@/types/rule";

export function getFlowRules(app: string): Promise<Result<FlowRule[]>> {
  return get("v2/flow/rules", { app });
}

export function addFlowRule(rule: FlowRule): Promise<Result<FlowRule>> {
  return post("v2/flow/rule", rule);
}

export function updateFlowRule(id: number, rule: FlowRule): Promise<Result<FlowRule>> {
  return put(`v2/flow/rule/${id}`, rule);
}

export function deleteFlowRule(id: number): Promise<Result<number>> {
  return del(`v2/flow/rule/${id}`);
}
