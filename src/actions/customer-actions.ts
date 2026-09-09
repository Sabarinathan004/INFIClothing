"use server"

import { createClient } from "@/lib/supabase/server";
import { parseGSTRecord } from "@/lib/gst-parser";
import { revalidatePath } from "next/cache";

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export async function fetchAndVerifyGST(gstNumber: string) {
  try {
    const cleanGst = gstNumber.trim().toUpperCase();

    if (!GST_REGEX.test(cleanGst)) {
      return { success: false, error: "Invalid GST Number format" };
    }

    const supabase = await createClient();

    // 1. Check if customer already exists locally to save API costs
    const { data: existing } = await supabase
      .from("customers")
      .select("*")
      .eq("verification_number", cleanGst)
      .single();

    if (existing) {
      return { success: true, source: 'db', data: existing };
    }

    // 2. Fetch from RapidAPI if not found locally
    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
    const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'gst-insights-api.p.rapidapi.com';

    if (!RAPIDAPI_KEY) {
      return { success: false, error: "GST API key is not configured. Please add RAPIDAPI_KEY to your Vercel environment variables." };
    }

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
      return { success: false, error: result.message || "Failed to fetch GST details from API" };
    }

    // 3. Parse the data defensively
    const parsedData = parseGSTRecord(result);

    // 4. Upsert the verified customer into the database
    const newCustomerData = {
      name: parsedData.customerName,
      address: parsedData.customerAddress,
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
      return { success: false, error: "Fetched GST details successfully, but failed to save to database." };
    }

    revalidatePath("/customers");
    return { success: true, source: 'api', data: savedCustomer };

  } catch (error: any) {
    console.error("GST Fetch Error:", error);
    return { success: false, error: error.message || "An unexpected error occurred while verifying GST." };
  }
}
