import { useQuery } from "@tanstack/react-query";
import { getMachines } from "@/api/app";

export function useMachines(app: string, enabled = true) {
  return useQuery({
    queryKey: ["machines", app],
    queryFn: async () => {
      const res = await getMachines(app);
      return res.data || [];
    },
    enabled: enabled && !!app,
    refetchInterval: 10_000,
  });
}
