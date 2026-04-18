import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { TrendingUp } from "lucide-react";
import * as metricApi from "@/api/metric";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import type { MetricResourceVO } from "@/types/metric";

export default function MetricPage() {
  const { app = "" } = useParams();
  const [page, setPage] = useState(1);
  const [desc, setDesc] = useState(true);
  const [searchKey, setSearchKey] = useState("");
  const [selectedResource, setSelectedResource] = useState("");
  const pageSize = 6;

  const { data: topData, isLoading } = useQuery({
    queryKey: ["metric-top", app, page, desc, searchKey],
    queryFn: async () => {
      const res = await metricApi.queryTopResourceMetric(app, page, pageSize, desc, searchKey || undefined);
      return res.data;
    },
    enabled: !!app,
    refetchInterval: 10_000,
  });

  const { data: detailData = [] } = useQuery({
    queryKey: ["metric-detail", app, selectedResource],
    queryFn: async () => {
      const end = Date.now();
      const start = end - 60 * 60 * 1000;
      const res = await metricApi.queryByAppAndResource(app, selectedResource, start, end);
      return res.data || [];
    },
    enabled: !!selectedResource,
    refetchInterval: 10_000,
  });

  const resources: MetricResourceVO[] = [];
  if (topData?.metrics) {
    for (const arr of Object.values(topData.metrics)) {
      resources.push(...(arr as MetricResourceVO[]));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">实时监控</h1>
        <Button variant="outline" size="sm" onClick={() => setDesc(!desc)}>
          <TrendingUp className="h-3.5 w-3.5 mr-1" />
          {desc ? "降序" : "升序"}
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <SearchInput value={searchKey} onChange={setSearchKey} placeholder="搜索资源名" />
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>资源名</TableHead>
              <TableHead>通过 QPS</TableHead>
              <TableHead>拒绝 QPS</TableHead>
              <TableHead>平均 RT (ms)</TableHead>
              <TableHead>线程数</TableHead>
              <TableHead>异常 QPS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.map((r, idx) => (
              <TableRow
                key={`${r.resource}-${idx}`}
                className={`cursor-pointer transition-colors ${selectedResource === r.resource ? "bg-accent" : ""}`}
                onClick={() => setSelectedResource(r.resource)}
              >
                <TableCell className="font-medium">{r.resource}</TableCell>
                <TableCell className="text-emerald-600">{r.passQps}</TableCell>
                <TableCell className="text-destructive font-medium">{r.blockQps}</TableCell>
                <TableCell>{r.averageRt}</TableCell>
                <TableCell>{r.threadCount}</TableCell>
                <TableCell>{r.exceptionQps}</TableCell>
              </TableRow>
            ))}
            {resources.length === 0 && <TableRow><TableCell colSpan={6}><EmptyState title="暂无监控数据" description="请确保应用有请求流量" /></TableCell></TableRow>}
          </TableBody>
        </Table>
      )}

      <Pagination
        currentPage={page}
        totalPages={topData?.totalPage ?? 1}
        onPageChange={setPage}
      />

      {selectedResource && detailData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{selectedResource}</CardTitle>
              <span className="text-xs text-muted-foreground">最近 1 小时</span>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={detailData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="timestamp" tickFormatter={(v: number) => new Date(v).toLocaleTimeString()} tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <RechartsTooltip labelFormatter={(v) => new Date(Number(v)).toLocaleTimeString()} />
                <Legend />
                <Line type="monotone" dataKey="passQps" name="通过 QPS" stroke="#22c55e" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="blockQps" name="拒绝 QPS" stroke="#ef4444" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="rt" name="响应时间(ms)" stroke="#f59e0b" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
