export interface GatewayApiDefinition {
  id?: number;
  app?: string;
  apiName: string;
  predicateItems: GatewayApiPredicateItem[];
}

export interface GatewayApiPredicateItem {
  pattern: string;
  matchStrategy: number; // 0=url pattern, 1=exact, 2=regex, 3=prefix
}

export interface GatewayFlowRule {
  id?: number;
  app?: string;
  resource: string;
  resourceMode: number; // 0=routeId, 1=apiGroupName
  grade: number;
  count: number;
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
