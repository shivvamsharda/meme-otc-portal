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

    // Expire any open deals past expiry time
    const nowIso = new Date().toISOString();

    const { data: toExpire, error: selErr } = await supabase
      .from("deals")
      .select("deal_id")
      .eq("status", "Open")
      .lte("expiry_timestamp", nowIso);

    if (selErr) {
      console.error("Failed to select expirable deals:", selErr);
      return new Response(JSON.stringify({ error: selErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let updated = 0;
    if (toExpire && toExpire.length > 0) {
      const { error: updErr } = await supabase
        .from("deals")
        .update({ status: "Expired", updated_at: new Date().toISOString() })
        .in("deal_id", toExpire.map((d: any) => d.deal_id));

      if (updErr) {
        console.error("Failed to update expired deals:", updErr);
        return new Response(JSON.stringify({ error: updErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      updated = toExpire.length;
    }

    return new Response(
      JSON.stringify({ success: true, expiredCount: updated }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("reconcile-deals error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
