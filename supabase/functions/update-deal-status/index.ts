import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      deal_id,
      status,
      transaction_signature,
      taker_address,
      transaction_type,
      user_address,
    } = body || {};

    if (!deal_id || !status || !transaction_type) {
      return new Response(
        JSON.stringify({ error: "deal_id, status and transaction_type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allowedStatuses = ["Completed", "Cancelled"] as const;
    if (!allowedStatuses.includes(status)) {
      return new Response(
        JSON.stringify({ error: "Invalid status" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allowedTxTypes = ["accept", "cancel", "create"] as const;
    if (!allowedTxTypes.includes(transaction_type)) {
      return new Response(
        JSON.stringify({ error: "Invalid transaction_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      console.error("Missing Supabase envs");
      return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: `Bearer ${serviceKey}` } },
    });

    // 1) Update deal row
    const dealUpdates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
      blockchain_synced: true,
    };
    if (transaction_signature) dealUpdates.transaction_signature = transaction_signature;
    if (taker_address) dealUpdates.taker_address = taker_address;
    if (status === "Completed") dealUpdates.completed_at = new Date().toISOString();

    const { data: updatedDeal, error: updateErr } = await supabase
      .from("deals")
      .update(dealUpdates)
      .eq("deal_id", deal_id)
      .select()
      .single();

    if (updateErr) {
      console.error("Failed to update deal:", updateErr);
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Confirm or create transaction log
    let txRecordId: string | null = null;
    const { data: lastTx, error: selErr } = await supabase
      .from("deal_transactions")
      .select("id")
      .eq("deal_id", deal_id)
      .eq("transaction_type", transaction_type)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!selErr && lastTx?.id) {
      txRecordId = lastTx.id;
    }

    if (txRecordId) {
      const { error: updTxErr } = await supabase
        .from("deal_transactions")
        .update({
          status: "confirmed",
          transaction_signature: transaction_signature ?? null,
          confirmed_at: new Date().toISOString(),
          error_message: null,
        })
        .eq("id", txRecordId);

      if (updTxErr) {
        console.warn("Failed to update existing transaction log:", updTxErr);
      }
    } else {
      const { error: insTxErr } = await supabase
        .from("deal_transactions")
        .insert({
          deal_id,
          transaction_type,
          user_address: user_address ?? taker_address ?? null,
          transaction_signature: transaction_signature ?? null,
          status: "confirmed",
        });
      if (insTxErr) {
        console.warn("Failed to insert transaction log:", insTxErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, deal: updatedDeal }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("update-deal-status error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
