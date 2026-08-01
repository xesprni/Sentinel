import { get, post, put, del } from "./client";
import type { Result } from "./types";
import type { ParamFlowRule } from "@/types/rule";

type ParamFlowRuleData = Omit<ParamFlowRule, "id" | "app" | "ip" | "port">;

interface ParamFlowRuleEntity {
  id?: number;
  app?: string;
  ip?: string;
  port?: number;
  rule: ParamFlowRuleData;
}

function flattenEntity(entity: ParamFlowRuleEntity): ParamFlowRule {
  return {
    id: entity.id,
    app: entity.app,
    ip: entity.ip,
    port: entity.port,
    ...entity.rule,
  };
}

function toEntity(rule: ParamFlowRule): ParamFlowRuleEntity {
  const { id, app, ip, port, ...data } = rule;
  return { id, app, ip, port, rule: data };
}

export async function getParamFlowRules(app: string, ip: string, port: number): Promise<Result<ParamFlowRule[]>> {
  const response = await get<ParamFlowRuleEntity[]>("paramFlow/rules", { app, ip, port });
  return { ...response, data: (response.data || []).map(flattenEntity) };
}

export function addParamFlowRule(rule: ParamFlowRule): Promise<Result<ParamFlowRuleEntity>> {
  return post("paramFlow/rule", toEntity(rule));
}

export function updateParamFlowRule(id: number, rule: ParamFlowRule): Promise<Result<ParamFlowRuleEntity>> {
  return put(`paramFlow/rule/${id}`, toEntity({ ...rule, id }));
}

export function deleteParamFlowRule(id: number): Promise<Result<null>> {
  return del(`paramFlow/rule/${id}`);
}
