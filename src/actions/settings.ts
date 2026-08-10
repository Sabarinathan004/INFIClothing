"use server"

import { createClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";

// Wrap the actual DB call in a helper
async function fetchSettingsFromDb() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("company_settings")
    .select("*")
    .single();

  if (error && error.code !== "PGRST116") {
    return null;
  }

  return data;
}

// Cache the settings for the session / 1 hour
export const getSettings = unstable_cache(
  async () => {
    return fetchSettingsFromDb();
  },
  ['company_settings'],
  { revalidate: 3600, tags: ['settings'] }
);


export async function updateSettings(data: any) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("company_settings")
    .select("id")
    .single();

  let error;
  if (existing) {
    const { error: updateError } = await supabase
      .from("company_settings")
      .update(data)
      .eq("id", existing.id);
    error = updateError;
  } else {
    const { error: insertError } = await supabase
      .from("company_settings")
      .insert([data]);
    error = insertError;
  }

  if (error) {
    console.error("Error updating settings:", error);
    throw new Error("Failed to update settings");
  }

  const { revalidateTag } = await import("next/cache");
  revalidateTag("settings", "max");

  return { success: true };
}
