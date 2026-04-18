export interface ClusterAppState {
  server?: {
    flowId?: number;
    port?: number;
    mode?: number; // 0=notSet, 1=embedded, 2=standalone
    connectedCount?: number;
    state?: number;
  };
  client?: {
    flowId?: number;
    mode?: number;
    clientConfig?: {
      serverHost?: string;
      serverPort?: number;
      requestTimeout?: number;
    };
  };
}

export interface ClusterAssignment {
  ip: string;
  port: number;
  mode: number;
  clientIdSet?: string[];
}

export interface ClusterServerState {
  flowId: number;
  port: number;
  namespace: string;
  connectedCount: number;
  state: number;
}
