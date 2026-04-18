import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
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

  const { data: topData } = useQuery({
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
      const start = end - 60 * 60 * 1000; // last hour
      const res = await metricApi.queryByAppAndResource(app, selectedResource, start, end);
      return res.data || [];
    },
    enabled: !!selectedResource,
    refetchInterval: 10_000,
  });

  const resources: MetricResourceVO[] = [];
  if (topData?.metrics) {
    for (const arr of Object.values(topData.metrics)) {
      resources.push(...arr);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">实时监控 — {app}</h1>
      <div className="flex items-center gap-2">
        <SearchInput value={searchKey} onChange={setSearchKey} placeholder="搜索资源名" />
        <Button variant="outline" size="sm" onClick={() => setDesc(!desc)}>
          {desc ? "降序" : "升序"}
        </Button>
      </div>

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
              className="cursor-pointer hover:bg-accent"
              onClick={() => setSelectedResource(r.resource)}
            >
              <TableCell>{r.resource}</TableCell>
              <TableCell>{r.passQps}</TableCell>
              <TableCell className="text-destructive">{r.blockQps}</TableCell>
              <TableCell>{r.averageRt}</TableCell>
              <TableCell>{r.threadCount}</TableCell>
              <TableCell>{r.exceptionQps}</TableCell>
            </TableRow>
          ))}
          {resources.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">暂无数据</TableCell></TableRow>}
        </TableBody>
      </Table>

      <Pagination
        currentPage={page}
        totalPages={topData?.totalPage ?? 1}
        onPageChange={setPage}
      />

      {selectedResource && detailData.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-medium">{selectedResource} — 详细指标</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={detailData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tickFormatter={(v: number) => new Date(v).toLocaleTimeString()} />
              <YAxis />
              <RechartsTooltip labelFormatter={(v) => new Date(Number(v)).toLocaleTimeString()} />
              <Legend />
              <Line type="monotone" dataKey="passQps" name="通过 QPS" stroke="#52c41a" dot={false} />
              <Line type="monotone" dataKey="blockQps" name="拒绝 QPS" stroke="#ff4d4f" dot={false} />
              <Line type="monotone" dataKey="rt" name="响应时间(ms)" stroke="#faad14" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
