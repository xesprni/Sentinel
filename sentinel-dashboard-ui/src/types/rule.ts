export interface FlowRule {
  id?: number;
  app?: string;
  resource: string;
  limitApp: string;
  grade: number; // 1=QPS, 0=thread
  count: number;
  strategy: number; // 0=direct, 1=associate, 2=chain
  refResource?: string;
  controlBehavior: number; // 0=default, 1=warmup, 2=pace, 3=warmup+pace
  warmUpPeriodSec?: number;
  maxQueueingTimeMs?: number;
  clusterMode: boolean;
  clusterConfig?: {
    flowId?: number;
    thresholdType?: number;
    fallbackToLocalWhenFail?: boolean;
    strategy?: number;
  };
}

export interface DegradeRule {
  id?: number;
  app?: string;
  resource: string;
  limitApp: string;
  grade: number; // 0=slowRT, 1=exceptionRatio, 2=exceptionCount
  count: number;
  timeWindow: number;
  minRequestAmount: number;
  statIntervalMs: number;
  slowRatioThreshold?: number;
}

export interface SystemRule {
  id?: number;
  app?: string;
  highestSystemLoad?: number;
  highestCpuUsage?: number;
  avgRt?: number;
  maxThread?: number;
  qps?: number;
}

export interface AuthorityRule {
  id?: number;
  app?: string;
  resource: string;
  limitApp: string;
  strategy: number; // 0=whitelist, 1=blacklist
}

export interface ParamFlowRule {
  id?: number;
  app?: string;
  resource: string;
  limitApp?: string;
  grade: number; // 1=QPS
  paramIdx: number;
  count: number;
  durationInSec: number;
  clusterMode: boolean;
  clusterConfig?: {
    flowId?: number;
    thresholdType?: number;
    fallbackToLocalWhenFail?: boolean;
  };
  paramFlowItemList?: ParamFlowItem[];
}

export interface ParamFlowItem {
  object: string;
  classType: string;
  count: number;
}
