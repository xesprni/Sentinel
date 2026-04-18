import { get, postWithParams } from "./client";
import type { Result } from "./types";
import type { AppName, AppBriefInfo, MachineInfo } from "@/types/app";

export function getAppNames(): Promise<Result<AppName[]>> {
  return get("app/names.json");
}

export function getAppBriefInfos(): Promise<Result<AppBriefInfo[]>> {
  return get("app/briefinfos.json");
}

export function getMachines(app: string): Promise<Result<MachineInfo[]>> {
  return get(`app/${app}/machines.json`);
}

export function removeMachine(app: string, ip: string, port: number): Promise<Result<null>> {
  return postWithParams(`app/${app}/machine/remove.json`, { ip, port });
}
