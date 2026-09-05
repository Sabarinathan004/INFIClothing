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
  const supabase = await createClient();

  let request = supabase
    .from("customers")
    .select("id, name, mobile, email, address, verification_type, verification_number, gst_number")
    .order("created_at", { ascending: false })
    .limit(15);

  // If a query is provided, filter by it
  if (query && query.length >= 2) {
    request = request.or(`name.ilike.%${query}%,mobile.ilike.%${query}%,verification_number.ilike.%${query}%`);
  }

  const { data, error } = await request;

  if (error) return [];
  return data;
}

export async function fetchGSTDetails(cleanGst: string) {
  const supabase = await createClient();

  // 1. Always verify with RapidAPI first
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'gst-insights-api.p.rapidapi.com'; 

  if (!RAPIDAPI_KEY) {
    throw new Error("GST API key is not configured. Please add RAPIDAPI_KEY to your .env file.");
  }

  try {
    const response = await fetch(`https://${RAPIDAPI_HOST}/getGSTDetailsUsingGST/${cleanGst}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to fetch GST details from API");
    }

    if (!result.success || !result.data) {
      throw new Error(result.message || "Invalid or Inactive GST number");
    }

    const data = result.data;
    
    // Parse address
    const addr = data.principalAddress?.address || {};
    const fullAddress = [
      addr.buildingName,
      addr.buildingNumber,
      addr.street,
      addr.location,
      addr.district,
      addr.streetcd,
      addr.pincode
    ].filter(Boolean).join(", ");
    
    const parsedName = data.tradeName || data.legalName || "Unknown Company";

    // 2. Check if customer already exists in our database
    const { data: existing } = await supabase
      .from("customers")
      .select("*")
      .eq("verification_number", cleanGst)
      .single();

    if (existing) {
      // Return fresh API data but include the existing customer ID
      return { 
        source: 'api', 
        data: { ...existing, name: parsedName, address: fullAddress } 
      };
    }

    // 3. Save brand new customer to database
    const newCustomerData = {
      name: parsedName,
      address: fullAddress,
      verification_type: "GST",
      verification_number: cleanGst,
      gst_number: cleanGst
    };

    const { data: savedCustomer, error: saveError } = await supabase
      .from("customers")
      .insert([newCustomerData])
      .select()
      .single();

    if (saveError) {
      console.error("Error saving fetched GST customer:", saveError);
      throw new Error("Fetched GST details successfully, but failed to save to database.");
    }

    revalidatePath("/customers");
    return { source: 'api', data: savedCustomer };

  } catch (error: any) {
    console.error("GST Fetch Error:", error);
    throw new Error(error.message || "An unexpected error occurred while fetching GST details.");
  }
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
