import { get, post } from "./client";
import type { Result } from "./types";
import type { SystemRule } from "@/types/rule";

export function getSystemRules(app: string, ip?: string, port?: number): Promise<Result<SystemRule[]>> {
  return get("system/rules.json", { app, ...(ip && { ip }), ...(port && { port }) });
}

export function addSystemRule(rule: SystemRule): Promise<Result<null>> {
  return post("system/new.json", rule);
}

export function updateSystemRule(rule: SystemRule): Promise<Result<null>> {
  return get("system/save.json", rule as unknown as Record<string, string>);
}

export function deleteSystemRule(id: number): Promise<Result<null>> {
  return post("system/delete.json", { id });
}
