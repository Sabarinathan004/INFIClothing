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
  const supabase = await createClient();

  let request = supabase
    .from("bundles")
    .select("id, name, hsn_code, unit, default_price, mrp, gst_rate, current_stock")
    .eq("is_active", true)
    .order("name", { ascending: true })
    .limit(25);

  if (query && query.trim().length > 0) {
    request = request.or(`name.ilike.%${query}%,hsn_code.ilike.%${query}%`);
  }

  const { data, error } = await request;

  if (error) {
    // Fallback without newer columns if migration pending
    const fallback = await supabase
      .from("bundles")
      .select("id, name, hsn_code, default_price")
      .eq("is_active", true)
      .order("name", { ascending: true })
      .limit(25);

    return fallback.data || [];
  }
  return data || [];
}

export async function createBundle(data: BundleSchemaType) {
  const supabase = await createClient();

  let { data: newBundle, error } = await supabase
    .from("bundles")
    .insert([data])
    .select()
    .single();

  if (error) {
    // Defensive retry with base columns
    const fallbackData = {
      name: data.name,
      hsn_code: data.hsn_code,
      default_price: data.default_price,
      is_active: data.is_active,
    };
    const retry = await supabase.from("bundles").insert([fallbackData]).select().single();
    if (retry.error) {
      console.error("Error creating bundle:", retry.error);
      throw new Error(retry.error.message);
    }
    newBundle = retry.data;
  }

  revalidatePath("/bundles");
  return { success: true, data: newBundle };
}

export async function updateBundle(id: string, data: BundleSchemaType) {
  const supabase = await createClient();

  let { data: updatedBundle, error } = await supabase
    .from("bundles")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    const fallbackData = {
      name: data.name,
      hsn_code: data.hsn_code,
      default_price: data.default_price,
      is_active: data.is_active,
    };
    const retry = await supabase.from("bundles").update(fallbackData).eq("id", id).select().single();
    if (retry.error) {
      console.error(`Error updating bundle ${id}:`, retry.error);
      throw new Error(retry.error.message);
    }
    updatedBundle = retry.data;
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
