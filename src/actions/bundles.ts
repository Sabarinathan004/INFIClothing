"use server"

import { createClient } from "@/lib/supabase/server";
import { BundleSchemaType } from "@/schemas/bundle";
import { revalidatePath } from "next/cache";

export async function getBundles(activeOnly = false, page: number = 1, pageSize: number = 50) {
  const supabase = await createClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let request = supabase
    .from("bundles")
    .select("*", { count: 'exact' })
    .order("name", { ascending: true })
    .range(from, to);

  if (activeOnly) {
    request = request.eq("is_active", true);
  }

  const { data, count, error } = await request;

  if (error) {
    return { data: [], count: 0 };
  }

  return { data, count: count || 0 };
}

export async function searchBundles(query: string) {
  if (!query || query.length < 2) return [];
  
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bundles")
    .select("id, name, hsn_code, default_price")
    .eq("is_active", true)
    .or(`name.ilike.%${query}%,hsn_code.ilike.%${query}%`)
    .order("name", { ascending: true })
    .limit(15);

  if (error) return [];
  return data;
}

export async function createBundle(data: BundleSchemaType) {
  const supabase = await createClient();

  const { data: newBundle, error } = await supabase
    .from("bundles")
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error("Error creating bundle:", error);
    throw new Error(error.message);
  }

  revalidatePath("/bundles");
  return { success: true, data: newBundle };
}

export async function updateBundle(id: string, data: BundleSchemaType) {
  const supabase = await createClient();

  const { data: updatedBundle, error } = await supabase
    .from("bundles")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating bundle ${id}:`, error);
    throw new Error(error.message);
  }

  revalidatePath("/bundles");
  return { success: true, data: updatedBundle };
}

export async function toggleBundleStatus(id: string, is_active: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("bundles")
    .update({ is_active })
    .eq("id", id);

  if (error) {
    console.error(`Error toggling bundle status ${id}:`, error);
    throw new Error("Failed to update status");
  }

  revalidatePath("/bundles");
  return { success: true };
}

export async function deleteBundle(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("bundles")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`Error deleting bundle ${id}:`, error);
    throw new Error(error.message);
  }

  revalidatePath("/bundles");
  return { success: true };
}
