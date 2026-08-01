export const CLUSTER_MODE_CLIENT = 0;
export const CLUSTER_MODE_SERVER = 1;

export interface ClusterStateInfo {
  mode: number;
  lastModified?: number;
  clientAvailable: boolean;
  serverAvailable: boolean;
}

export interface ClusterClientConfig {
  serverHost: string;
  serverPort: number;
  requestTimeout: number;
  clientState?: number;
}

export interface ClusterServerTransport {
  port: number;
  idleSeconds?: number;
}

export interface ClusterServerFlow {
  maxAllowedQps: number;
  exceedCount?: number;
  maxOccupyRatio?: number;
  intervalMs?: number;
  sampleCount?: number;
}

export interface ClusterConnection {
  address: string;
  connectedAt?: number;
}

export interface ClusterConnectionGroup {
  namespace: string;
  connectionSet?: ClusterConnection[];
  connectedCount: number;
}

export interface ClusterRequestLimit {
  namespace: string;
  currentQps: number;
  maxAllowedQps: number;
}

export interface ClusterServerState {
  appName?: string;
  transport?: ClusterServerTransport;
  flow?: ClusterServerFlow;
  namespaceSet?: string[];
  port: number;
  connection?: ClusterConnectionGroup[];
  requestLimitData?: ClusterRequestLimit[];
  embedded?: boolean;
}

export interface ClusterUniversalState {
  stateInfo: ClusterStateInfo;
  client?: { clientConfig: ClusterClientConfig };
  server?: ClusterServerState;
}

export interface ClusterMachineState {
  ip: string;
  commandPort: number;
  state: ClusterUniversalState;
}

export interface ClusterAppServerState {
  id: string;
  ip: string;
  port: number;
  connectedCount: number;
  belongToApp: boolean;
  state: ClusterServerState;
}

export interface ClusterAppClientState {
  id: string;
  ip: string;
  commandPort: number;
  state: { clientConfig: ClusterClientConfig };
}

export interface ClusterAssignMap {
  machineId: string;
  ip: string;
  port: number;
  belongToApp: boolean;
  clientSet: string[];
  namespaceSet?: string[];
  maxAllowedQps?: number;
}

export interface ClusterFullAssignRequest {
  clusterMap: ClusterAssignMap[];
  remainingList: string[];
}

export interface ClusterSingleAssignRequest {
  clusterMap: ClusterAssignMap;
  remainingList: string[];
}

export interface ClusterAssignResult {
  failedServerSet: string[];
  failedClientSet: string[];
}

export interface ClusterClientModifyRequest {
  mode: typeof CLUSTER_MODE_CLIENT;
  clientConfig: ClusterClientConfig;
}

export interface ClusterServerModifyRequest {
  mode: typeof CLUSTER_MODE_SERVER;
  flowConfig: ClusterServerFlow;
  transportConfig: ClusterServerTransport;
  namespaceSet: string[];
}
