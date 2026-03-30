import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertMedicine } from "@shared/schema";

export function useMedicines() {
  return useQuery({
    queryKey: [api.medicines.list.path],
    queryFn: async () => {
      const res = await fetch(api.medicines.list.path);
      if (!res.ok) throw new Error("Failed to fetch medicines");
      return await res.json();
    },
  });
}

export function useMedicine(id: string) {
  return useQuery({
    queryKey: [api.medicines.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.medicines.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch medicine");
      return await res.json();
    },
    enabled: !!id,
  });
}

export function useMedicineByBarcode(barcode: string) {
  return useQuery({
    queryKey: [api.medicines.getByBarcode.path, barcode],
    queryFn: async () => {
      if (!barcode) return null;
      const url = buildUrl(api.medicines.getByBarcode.path, { barcode });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch medicine by barcode");
      return await res.json();
    },
    enabled: !!barcode,
    retry: false,
  });
}

export function useCreateMedicine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertMedicine) => {
      const validated = api.medicines.create.input.parse(data);
      const res = await fetch(api.medicines.create.path, {
        method: api.medicines.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      if (!res.ok) throw new Error("Failed to create medicine");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.medicines.list.path] });
    },
  });
}

export function useUpdateMedicine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: { id: string } & Partial<InsertMedicine>) => {
      const validated = api.medicines.update.input.parse(data);
      const url = buildUrl(api.medicines.update.path, { id });
      const res = await fetch(url, {
        method: api.medicines.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      if (!res.ok) throw new Error("Failed to update medicine");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.medicines.list.path] });
    },
  });
}

export function useDeleteMedicine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.medicines.delete.path, { id });
      const res = await fetch(url, { method: api.medicines.delete.method });
      if (!res.ok) throw new Error("Failed to delete medicine");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.medicines.list.path] });
    },
  });
}
