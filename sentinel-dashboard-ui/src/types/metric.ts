export interface MetricData {
  id: string;
  app: string;
  resource: string;
  timestamp: number;
  passQps: number;
  blockQps: number;
  successQps: number;
  exceptionQps: number;
  rt: number;
  count: number;
}

export interface MetricResourceVO {
  app: string;
  resource: string;
  threadCount: number;
  passQps: number;
  blockQps: number;
  totalQps: number;
  averageRt: number;
  successQps: number;
  exceptionQps: number;
  oneMinutePass: number;
  oneMinuteBlock: number;
  oneMinuteException: number;
  oneMinuteTotal: number;
}
