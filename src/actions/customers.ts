"use server"

import { createClient } from "@/lib/supabase/server";
import { CustomerSchemaType } from "@/schemas/customer";
import { revalidatePath } from "next/cache";

export async function getCustomers(query: string = "", page: number = 1, pageSize: number = 50) {
  const supabase = await createClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let request = supabase
    .from("customers")
    .select("*", { count: 'exact' })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (query) {
    request = request.or(
      `name.ilike.%${query}%,mobile.ilike.%${query}%,verification_number.ilike.%${query}%`
    );
  }

  const { data, count, error } = await request;

  if (error) {
    return { data: [], count: 0 };
  }

  return { data, count: count || 0 };
}

export async function searchCustomers(query: string) {
  if (!query || query.length < 2) return [];
  
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, mobile, email, address, verification_type, verification_number, gst_number")
    .or(`name.ilike.%${query}%,mobile.ilike.%${query}%,verification_number.ilike.%${query}%`)
    .limit(15);

  if (error) return [];
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

  const { data: newCustomer, error } = await supabase
    .from("customers")
    .insert([{
      name: data.name,
      mobile: data.mobile,
      email: data.email,
      address: data.address,
      verification_type: data.verification_type,
      verification_number: data.verification_number?.trim().toUpperCase() || null,
      // Keep gst_number in sync for backward compatibility
      gst_number: data.verification_type === 'GST'
        ? data.verification_number?.trim().toUpperCase() || null
        : null,
    }])
    .select()
    .single();

  if (error) {
    console.error("Error creating customer:", error);
    throw new Error(error.message);
  }

  revalidatePath("/customers");
  return { success: true, data: newCustomer };
}

export async function updateCustomer(id: string, data: CustomerSchemaType) {
  const supabase = await createClient();

  const { data: updatedCustomer, error } = await supabase
    .from("customers")
    .update({
      name: data.name,
      mobile: data.mobile,
      email: data.email,
      address: data.address,
      verification_type: data.verification_type,
      verification_number: data.verification_number?.trim().toUpperCase() || null,
      // Keep gst_number in sync for backward compatibility
      gst_number: data.verification_type === 'GST'
        ? data.verification_number?.trim().toUpperCase() || null
        : null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating customer ${id}:`, error);
    throw new Error(error.message);
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  return { success: true, data: updatedCustomer };
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
