"use server"

import { createClient } from "@/lib/supabase/server";
import { BundleSchemaType } from "@/schemas/bundle";
import { revalidatePath } from "next/cache";

export async function getBundles(activeOnly = false) {
  const supabase = await createClient();

  let request = supabase
    .from("bundles")
    .select("*")
    .order("name", { ascending: true });

  if (activeOnly) {
    request = request.eq("is_active", true);
  }

  const { data, error } = await request;

  if (error) {
    return [];
  }

  return data;
}

export async function createBundle(data: BundleSchemaType) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("bundles")
    .insert([data]);

  if (error) {
    console.error("Error creating bundle:", error);
    throw new Error(error.message);
  }

  revalidatePath("/bundles");
  return { success: true };
}

export async function updateBundle(id: string, data: BundleSchemaType) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("bundles")
    .update(data)
    .eq("id", id);

  if (error) {
    console.error(`Error updating bundle ${id}:`, error);
    throw new Error(error.message);
  }

  revalidatePath("/bundles");
  return { success: true };
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
