import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Bill, type InsertBill } from "@shared/schema";

export function useBills() {
  return useQuery({
    queryKey: ["/api/bills"],
    queryFn: async () => {
      const res = await fetch("/api/bills");
      if (!res.ok) throw new Error("Failed to fetch bills");
      return (await res.json()) as Bill[];
    },
  });
}

export function useBill(id: string) {
  return useQuery({
    queryKey: ["/api/bills", id],
    queryFn: async () => {
      const res = await fetch(`/api/bills/${id}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch bill");
      return (await res.json()) as Bill;
    },
    enabled: !!id,
  });
}

export function useCreateBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertBill) => {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create bill");
      return (await res.json()) as Bill;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bills"] });
    },
  });
}

export function useUpdateBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<InsertBill>) => {
      const res = await fetch(`/api/bills/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update bill");
      return (await res.json()) as Bill;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bills"] });
    },
  });
}

export function useDeleteBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/bills/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete bill");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bills"] });
    },
  });
}

export function useUpdateBillStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "draft" | "completed" | "printed" }) => {
      const res = await fetch(`/api/bills/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update bill status");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bills"] });
    },
  });
}
