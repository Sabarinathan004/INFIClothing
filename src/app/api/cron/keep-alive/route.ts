import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // 1. Verify CRON_SECRET if configured; otherwise permit zero-config public keep-alive
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    const expectedAuth = `Bearer ${cronSecret}`;
    if (authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  const timestamp = new Date().toISOString();

  try {
    const supabase = await createClient();

    // 2. Primary check: Call ping_supabase_heartbeat RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "ping_supabase_heartbeat",
      { ping_source: "nextjs_api_cron_48h" }
    );

    if (!rpcError && rpcData) {
      return NextResponse.json(
        {
          status: "alive",
          timestamp,
          mode: "rpc",
          details: rpcData,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store, max-age=0",
          },
        }
      );
    }

    // 3. Graceful fallback: Execute live PostgREST read query to register Supabase gateway traffic
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("company_settings")
      .select("id, company_name")
      .limit(1);

    if (fallbackError) {
      const { data: custData, error: custError } = await supabase
        .from("customers")
        .select("id")
        .limit(1);

      return NextResponse.json(
        {
          status: "alive",
          timestamp,
          mode: "fallback_customers",
          warning: rpcError?.message,
          details: custData || [],
          error: custError?.message || null,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store, max-age=0",
          },
        }
      );
    }

    return NextResponse.json(
      {
        status: "alive",
        timestamp,
        mode: "fallback_query",
        warning: rpcError ? rpcError.message : undefined,
        details: fallbackData,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "alive_degraded",
        timestamp,
        error: error.message || "Heartbeat ping encountered an exception",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }
}
