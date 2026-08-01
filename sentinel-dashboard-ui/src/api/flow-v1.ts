import { get, post, del, putWithParams } from "./client";
import type { Result } from "./types";
import type { FlowRule } from "@/types/rule";

export function getFlowRules(app: string, ip: string, port: number): Promise<Result<FlowRule[]>> {
  return get("v1/flow/rules", { app, ip, port });
}

export function addFlowRule(rule: FlowRule): Promise<Result<null>> {
  return post("v1/flow/rule", rule);
}

export function updateFlowRule(rule: FlowRule): Promise<Result<null>> {
  const params: Record<string, string | number | boolean> = {};
  const keys: (keyof FlowRule)[] = [
    "id", "app", "limitApp", "resource", "grade", "count", "strategy",
    "refResource", "controlBehavior", "warmUpPeriodSec", "maxQueueingTimeMs",
  ];
  for (const key of keys) {
    const value = rule[key];
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      params[key] = value;
    }
  }
  return putWithParams("v1/flow/save.json", params);
}

export function deleteFlowRule(id: number): Promise<Result<null>> {
  return del("v1/flow/delete.json", { id });
}
