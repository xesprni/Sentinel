export interface GatewayApiDefinition {
  id?: number;
  app?: string;
  ip?: string;
  port?: number;
  apiName: string;
  predicateItems: GatewayApiPredicateItem[];
}

export interface GatewayApiPredicateItem {
  pattern: string;
  matchStrategy: number; // 0=exact, 1=prefix, 2=regex
}

export interface GatewayFlowRule {
  id?: number;
  app?: string;
  ip?: string;
  port?: number;
  resource: string;
  resourceMode: number; // 0=routeId, 1=apiGroupName
  grade: number;
  count: number;
  interval?: number;
  intervalUnit?: number;
  intervalSec?: number;
  controlBehavior?: number;
  burst?: number;
  maxQueueingTimeoutMs?: number;
  paramItem?: {
    parseStrategy: number;
    fieldName?: string;
    pattern?: string;
    matchStrategy?: number;
  };
}
