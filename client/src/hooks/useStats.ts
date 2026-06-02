import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useStats(month?: string) {
  return useQuery({
    queryKey: ["stats", month],
    queryFn: () => api.stats(month)
  });
}
