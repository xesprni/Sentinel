import { get, post, put, del } from "./client";
import type { Result } from "./types";
import type { DegradeRule } from "@/types/rule";

export function getDegradeRules(app: string, ip?: string, port?: number): Promise<Result<DegradeRule[]>> {
  return get("degrade/rules.json", { app, ...(ip && { ip }), ...(port && { port }) });
}

export function addDegradeRule(rule: DegradeRule): Promise<Result<null>> {
  return post("degrade/rule", rule);
}

export function updateDegradeRule(id: number, rule: DegradeRule): Promise<Result<null>> {
  return put(`degrade/rule/${id}`, rule);
}

export function deleteDegradeRule(id: number): Promise<Result<null>> {
  return del(`degrade/rule/${id}`);
}
