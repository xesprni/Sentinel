import { get, post, put, del } from "./client";
import type { Result } from "./types";
import type { ParamFlowRule } from "@/types/rule";

export function getParamFlowRules(app: string, ip: string, port: number): Promise<Result<ParamFlowRule[]>> {
  return get("paramFlow/rules", { app, ip, port });
}

export function addParamFlowRule(rule: ParamFlowRule): Promise<Result<null>> {
  return post("paramFlow/rule", rule);
}

export function updateParamFlowRule(id: number, rule: ParamFlowRule): Promise<Result<null>> {
  return put(`paramFlow/rule/${id}`, rule);
}

export function deleteParamFlowRule(id: number): Promise<Result<null>> {
  return del(`paramFlow/rule/${id}`);
}
