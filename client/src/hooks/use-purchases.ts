import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Restock, type InsertRestock } from "@shared/schema";
import { api } from "@shared/routes";

export function usePurchases() {
  return useQuery<Restock[]>({
    queryKey: [api.restock.list.path],
    queryFn: async () => {
      const res = await fetch(api.restock.list.path);
      if (!res.ok) throw new Error("Failed to fetch restock history");
      return res.json();
    },
  });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertRestock) => {
      const res = await fetch(api.restock.create.path, {
        method: api.restock.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create restock entry");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.restock.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.medicines.list.path] });
    },
  });
}
