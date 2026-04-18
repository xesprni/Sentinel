import { get, post, put, del } from "./client";
import type { Result } from "./types";
import type { AuthorityRule } from "@/types/rule";

export function getAuthorityRules(app: string, ip?: string, port?: number): Promise<Result<AuthorityRule[]>> {
  return get("authority/rules", { app, ...(ip && { ip }), ...(port && { port }) });
}

export function addAuthorityRule(rule: AuthorityRule): Promise<Result<null>> {
  return post("authority/rule", rule);
}

export function updateAuthorityRule(id: number, rule: AuthorityRule): Promise<Result<null>> {
  return put(`authority/rule/${id}`, rule);
}

export function deleteAuthorityRule(id: number): Promise<Result<null>> {
  return del(`authority/rule/${id}`);
}
