import { useQuery } from "@tanstack/react-query";
import { getAppBriefInfos } from "@/api/app";

export function useApps() {
  return useQuery({
    queryKey: ["apps"],
    queryFn: async () => {
      const res = await getAppBriefInfos();
      return res.data || [];
    },
    refetchInterval: 10_000,
  });
}
