"use server"

import { createClient } from "@/lib/supabase/server";
import { CustomerSchemaType } from "@/schemas/customer";
import { revalidatePath } from "next/cache";

export async function getCustomers(query: string = "") {
  const supabase = await createClient();

  let request = supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (query) {
    request = request.or(`name.ilike.%${query}%,mobile.ilike.%${query}%,gst_number.ilike.%${query}%`);
  }

  const { data, error } = await request;

  if (error) {
    return [];
  }

  return data;
}

export async function getCustomerById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching customer ${id}:`, error);
    throw new Error("Failed to fetch customer details");
  }

  return data;
}

export async function createCustomer(data: CustomerSchemaType) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("customers")
    .insert([data]);

  if (error) {
    console.error("Error creating customer:", error);
    throw new Error(error.message);
  }

  revalidatePath("/customers");
  return { success: true };
}

export async function updateCustomer(id: string, data: CustomerSchemaType) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("customers")
    .update(data)
    .eq("id", id);

  if (error) {
    console.error(`Error updating customer ${id}:`, error);
    throw new Error(error.message);
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  return { success: true };
}

export async function deleteCustomer(id: string) {
  const supabase = await createClient();

  // Note: The database schema uses ON DELETE RESTRICT (or SET NULL) for invoices.
  // If there are existing invoices, Supabase will throw an error automatically.
  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`Error deleting customer ${id}:`, error);
    
    // Check if it's a foreign key violation (23503)
    if (error.code === '23503') {
      throw new Error("Cannot delete customer because they have existing invoices. Please cancel or delete the invoices first.");
    }
    
    throw new Error(error.message);
  }

  revalidatePath("/customers");
  return { success: true };
}
