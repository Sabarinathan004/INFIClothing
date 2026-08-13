"use server"

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";

export async function getSettings() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("company_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching settings:", error);
    return null;
  }

  return data;
}

const ALLOWED_SETTINGS_KEYS = [
  "company_name",
  "company_address",
  "gst_number",
  "phone_number",
  "email",
  "upi_id",
  "default_gst_rate",
  "payment_method",
  "bank_account_number",
  "bank_ifsc_code",
  "bank_name",
  "bank_account_holder",
  "cash_instructions",
];

export async function updateSettings(data: any) {
  const supabase = await createClient();

  // Clean data payload to only include valid columns in company_settings table
  const cleanData: Record<string, any> = {};
  for (const key of ALLOWED_SETTINGS_KEYS) {
    if (key in data) {
      cleanData[key] = data[key];
    }
  }

  const { data: existing } = await supabase
    .from("company_settings")
    .select("id")
    .limit(1)
    .maybeSingle();

  let error;
  let savedData = null;

  if (existing?.id) {
    const { data: updated, error: updateError } = await supabase
      .from("company_settings")
      .update({
        ...cleanData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();
    error = updateError;
    savedData = updated;
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("company_settings")
      .insert([cleanData])
      .select()
      .single();
    error = insertError;
    savedData = inserted;
  }

  if (error) {
    console.error("Error updating settings:", error);
    throw new Error(error.message || "Failed to update settings");
  }

  revalidateTag("settings", "max");
  revalidatePath("/settings");
  revalidatePath("/invoices");


  return { success: true, data: savedData };
}
