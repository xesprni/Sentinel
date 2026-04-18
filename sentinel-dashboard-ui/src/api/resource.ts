import { get } from "./client";
import type { Result } from "./types";

export interface ResourceNode {
  id: number;
  parentIdx: number;
  threadNum: number;
  resource: string;
  timeStamp: number;
  passQps: number;
  blockQps: number;
  successQps: number;
  exceptionQps: number;
  rt: number;
  children?: ResourceNode[];
}

export function getMachineResources(ip: string, port: number, type?: string): Promise<Result<ResourceNode[]>> {
  return get("resource/machineResource.json", { ip, port, ...(type && { type }) });
}
