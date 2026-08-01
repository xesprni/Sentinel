export function formatMachineKey(ip: string, port: number): string {
  return `${ip}:${port}`;
}

export function parseMachineKey(value: string): { ip?: string; port?: number } {
  const separator = value.lastIndexOf(":");
  if (separator <= 0) return {};

  const ip = value.slice(0, separator);
  const port = Number(value.slice(separator + 1));
  if (!ip || !Number.isInteger(port) || port <= 0) return {};
  return { ip, port };
}
