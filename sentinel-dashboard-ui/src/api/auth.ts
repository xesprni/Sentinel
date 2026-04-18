import { post } from "./client";
import type { Result } from "./types";

export interface LoginParams {
  username: string;
  password: string;
}

export function login(params: LoginParams): Promise<Result<null>> {
  return post("auth/login", params);
}

export function logout(): Promise<Result<null>> {
  return post("auth/logout");
}

export function checkAuth(): Promise<Result<null>> {
  return post("auth/check");
}
