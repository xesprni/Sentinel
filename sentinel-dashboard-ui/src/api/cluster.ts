import { get, post } from "./client";
import type { Result } from "./types";
import type {
  ClusterAppClientState,
  ClusterAppServerState,
  ClusterAssignResult,
  ClusterClientModifyRequest,
  ClusterFullAssignRequest,
  ClusterMachineState,
  ClusterServerModifyRequest,
  ClusterSingleAssignRequest,
  ClusterUniversalState,
} from "@/types/cluster";

export function getClusterAppState(app: string): Promise<Result<ClusterMachineState[]>> {
  return get(`cluster/state/${app}`);
}

export function getClusterServerState(app: string): Promise<Result<ClusterAppServerState[]>> {
  return get(`cluster/server_state/${app}`);
}

export function getClusterClientState(app: string): Promise<Result<ClusterAppClientState[]>> {
  return get(`cluster/client_state/${app}`);
}

export function getClusterSingleState(app: string, ip: string, port: number): Promise<Result<ClusterUniversalState>> {
  return get("cluster/state_single", { app, ip, port });
}

export function modifyClusterSingleConfig(
  app: string,
  ip: string,
  port: number,
  config: ClusterClientModifyRequest | ClusterServerModifyRequest,
): Promise<Result<boolean>> {
  return post("cluster/config/modify_single", { app, ip, port, ...config });
}

export function assignAllClusterServers(app: string, assignment: ClusterFullAssignRequest): Promise<Result<ClusterAssignResult>> {
  return post(`cluster/assign/all_server/${app}`, assignment);
}

export function assignSingleClusterServer(app: string, assignment: ClusterSingleAssignRequest): Promise<Result<ClusterAssignResult>> {
  return post(`cluster/assign/single_server/${app}`, assignment);
}

export function unbindClusterServer(app: string, machineIds: string[]): Promise<Result<ClusterAssignResult>> {
  return post(`cluster/assign/unbind_server/${app}`, machineIds);
}
