import { get } from "./client";
import type { Result } from "./types";

export function getVersion(): Promise<Result<string>> {
  return get("version");
}
