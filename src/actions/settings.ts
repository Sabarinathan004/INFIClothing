"use server"

import { createClient } from "@/lib/supabase/server";

export async function getSettings() {
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

  return { success: true };
}
