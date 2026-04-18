import { get } from "./client";
import type { Result } from "./types";

/** Matches backend MetricVo */
export interface MetricVo {
  id: number;
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

/** Backend queryTopResourceMetric response data */
export interface MetricTopData {
  totalCount: number;
  totalPage: number;
  pageIndex: number;
  pageSize: number;
  metric: Record<string, MetricVo[]>;
}

export function queryTopResourceMetric(
  app: string,
  pageIndex: number,
  pageSize: number,
  desc?: boolean,
  searchKey?: string,
): Promise<Result<MetricTopData>> {
  return get("metric/queryTopResourceMetric.json", {
    app,
    pageIndex,
    pageSize,
    ...(desc !== undefined && { desc }),
    ...(searchKey && { searchKey }),
  });
}

export function queryByAppAndResource(
  app: string,
  resource: string,
  startTime: number,
  endTime: number,
): Promise<Result<MetricVo[]>> {
  return get("metric/queryByAppAndResource.json", {
    app,
    identity: resource,
    startTime,
    endTime,
  });
}
