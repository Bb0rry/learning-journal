import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useEntries(params: Record<string, string | number | undefined> = {}) {
  return useQuery({
    queryKey: ["entries", params],
    queryFn: () => api.entries(params)
  });
}
