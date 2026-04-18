export interface MachineInfo {
  app: string;
  hostname: string;
  ip: string;
  port: number;
  lastHeartbeat: number;
  heartbeatVersion: string;
  healthy: boolean;
  version: string;
}

export interface AppBriefInfo {
  app: string;
  appType: number;
  machines: MachineInfo[];
}

export interface AppName {
  app: string;
  appType: number;
  healthy: number;
  machines: number;
}
