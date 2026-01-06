import { useQuery, useMutation } from "@tanstack/react-query";
import { Settings, InsertSettings } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function useSettings() {
  const { data: settings, isLoading, error } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  const mutation = useMutation({
    mutationFn: async (newSettings: Partial<InsertSettings>) => {
      const res = await apiRequest("PUT", "/api/settings", newSettings);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
  });

  return {
    settings,
    isLoading,
    error,
    updateSettings: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}
