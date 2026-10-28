"use server"

import { createClient } from "@/lib/supabase/server";
import { CustomerSchemaType } from "@/schemas/customer";
import { parseGSTRecord } from "@/lib/gst-parser";
import { getPlaceOfSupply } from "@/lib/constants";
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
    .select("*")
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

    // 2. Parse data using our robust gst-parser
    const parsedData = parseGSTRecord(result, cleanGst);

    // 3. Check if customer already exists in our database
    const { data: existing } = await supabase
      .from("customers")
      .select("*")
      .eq("verification_number", cleanGst)
      .single();

    if (existing) {
      // Return fresh API data enriched with the existing customer ID and details
      return { 
        source: 'api', 
        data: {
          ...existing,
          name: parsedData.customerName,
          trade_name: parsedData.tradeName || existing.trade_name,
          legal_name: parsedData.legalName || existing.legal_name,
          pan_number: parsedData.panNumber || existing.pan_number,
          place_of_supply: parsedData.placeOfSupply || existing.place_of_supply,
          address: parsedData.customerAddress,
        }
      };
    }

    // 4. Save brand new customer to database
    const newCustomerData = {
      name: parsedData.customerName,
      trade_name: parsedData.tradeName,
      legal_name: parsedData.legalName,
      pan_number: parsedData.panNumber,
      place_of_supply: parsedData.placeOfSupply,
      address: parsedData.customerAddress,
      verification_type: "GST",
      verification_number: cleanGst,
      gst_number: cleanGst
    };

    let savedCustomer: any = null;
    const { data: saved, error: saveError } = await supabase
      .from("customers")
      .insert([newCustomerData])
      .select()
      .single();

    if (saveError) {
      console.warn("Primary customer insert failed, attempting legacy fallback:", saveError.message);
      const fallbackData = {
        name: parsedData.customerName,
        address: parsedData.customerAddress,
        verification_type: "GST",
        verification_number: cleanGst,
        gst_number: cleanGst
      };
      const { data: fallbackSaved, error: fallbackError } = await supabase
        .from("customers")
        .insert([fallbackData])
        .select()
        .single();

      if (fallbackError) {
        console.error("Error saving fetched GST customer:", fallbackError);
        throw new Error("Fetched GST details successfully, but failed to save to database.");
      }
      savedCustomer = { ...fallbackSaved, ...newCustomerData };
    } else {
      savedCustomer = saved;
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

  const cleanNum = data.verification_number?.trim().toUpperCase() || null;
  const derivedPan = data.pan_number || (data.verification_type === 'PAN' ? cleanNum : (data.verification_type === 'GST' && cleanNum && cleanNum.length >= 12 ? cleanNum.substring(2, 12) : null));
  const derivedPos = data.place_of_supply || (data.verification_type === 'GST' && cleanNum ? getPlaceOfSupply(cleanNum) : null);

  const payload: any = {
    name: data.name,
    trade_name: data.trade_name || data.name,
    legal_name: data.legal_name || data.name,
    pan_number: derivedPan,
    place_of_supply: derivedPos,
    mobile: data.mobile,
    email: data.email,
    address: data.address,
    verification_type: data.verification_type,
    verification_number: cleanNum,
    gst_number: data.verification_type === 'GST' ? cleanNum : null,
  };

  let newCustomer: any = null;
  const { data: inserted, error } = await supabase
    .from("customers")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.warn("Primary createCustomer failed, attempting legacy fallback:", error.message);
    const legacyPayload = {
      name: data.name,
      mobile: data.mobile,
      email: data.email,
      address: data.address,
      verification_type: data.verification_type,
      verification_number: cleanNum,
      gst_number: data.verification_type === 'GST' ? cleanNum : null,
    };
    const retry = await supabase.from("customers").insert([legacyPayload]).select().single();
    if (retry.error) {
      console.error("Error creating customer fallback:", retry.error);
      throw new Error(retry.error.message);
    }
    newCustomer = { ...retry.data, ...payload };
  } else {
    newCustomer = inserted;
  }

  revalidatePath("/customers");
  return { success: true, data: newCustomer };
}

export async function updateCustomer(id: string, data: CustomerSchemaType) {
  const supabase = await createClient();

  const cleanNum = data.verification_number?.trim().toUpperCase() || null;
  const derivedPan = data.pan_number || (data.verification_type === 'PAN' ? cleanNum : (data.verification_type === 'GST' && cleanNum && cleanNum.length >= 12 ? cleanNum.substring(2, 12) : null));
  const derivedPos = data.place_of_supply || (data.verification_type === 'GST' && cleanNum ? getPlaceOfSupply(cleanNum) : null);

  const payload: any = {
    name: data.name,
    trade_name: data.trade_name || data.name,
    legal_name: data.legal_name || data.name,
    pan_number: derivedPan,
    place_of_supply: derivedPos,
    mobile: data.mobile,
    email: data.email,
    address: data.address,
    verification_type: data.verification_type,
    verification_number: cleanNum,
    gst_number: data.verification_type === 'GST' ? cleanNum : null,
  };

  let updatedCustomer: any = null;
  const { data: updated, error } = await supabase
    .from("customers")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.warn("Primary updateCustomer failed, attempting legacy fallback:", error.message);
    const legacyPayload = {
      name: data.name,
      mobile: data.mobile,
      email: data.email,
      address: data.address,
      verification_type: data.verification_type,
      verification_number: cleanNum,
      gst_number: data.verification_type === 'GST' ? cleanNum : null,
    };
    const retry = await supabase
      .from("customers")
      .update(legacyPayload)
      .eq("id", id)
      .select()
      .single();

    if (retry.error) {
      console.error(`Error updating customer ${id} fallback:`, retry.error);
      throw new Error(retry.error.message);
    }
    updatedCustomer = { ...retry.data, ...payload };
  } else {
    updatedCustomer = updated;
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
