import { get } from "./client";
import type { Result } from "./types";
import type { MetricData, MetricResourceVO } from "@/types/metric";

export function queryTopResourceMetric(
  app: string,
  pageIndex: number,
  pageSize: number,
  desc?: boolean,
  searchKey?: string,
): Promise<Result<{ metrics: Record<string, MetricResourceVO[]>; totalPage: number }>> {
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
): Promise<Result<MetricData[]>> {
  return get("metric/queryByAppAndResource.json", {
    app,
    resource,
    startTime,
    endTime,
  });
}
