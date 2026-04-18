import { get, post } from "./client";
import type { Result } from "./types";
import type { ClusterAppState, ClusterServerState } from "@/types/cluster";

export function getClusterAppState(app: string): Promise<Result<ClusterAppState[]>> {
  return get(`cluster/state/${app}`);
}

export function getClusterServerState(app: string): Promise<Result<ClusterServerState[]>> {
  return get(`cluster/server_state/${app}`);
}

export function getClusterClientState(app: string): Promise<Result<ClusterAppState[]>> {
  return get(`cluster/client_state/${app}`);
}

export function getClusterSingleState(app: string, ip: string, port: number): Promise<Result<ClusterAppState>> {
  return get("cluster/state_single", { app, ip, port });
}

export function modifyClusterSingleConfig(app: string, ip: string, port: number, config: Record<string, unknown>): Promise<Result<null>> {
  return post("cluster/config/modify_single", { app, ip, port, ...config });
}

export function assignAllClusterServers(app: string, assignments: unknown): Promise<Result<null>> {
  return post(`cluster/assign/all_server/${app}`, assignments);
}

export function assignSingleClusterServer(app: string, assignment: unknown): Promise<Result<null>> {
  return post(`cluster/assign/single_server/${app}`, assignment);
}

export function unbindClusterServer(app: string, server: unknown): Promise<Result<null>> {
  return post(`cluster/assign/unbind_server/${app}`, server);
}
