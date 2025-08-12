import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting token metadata backfill...');

    // Get all unique token mints that don't have metadata
    const { data: deals, error: fetchError } = await supabaseClient
      .from('deals')
      .select('token_mint_offered, token_mint_requested, token_offered_name, token_offered_symbol, token_requested_name, token_requested_symbol')
      .or('token_offered_name.is.null,token_offered_symbol.is.null,token_requested_name.is.null,token_requested_symbol.is.null');

    if (fetchError) {
      throw new Error(`Failed to fetch deals: ${fetchError.message}`);
    }

    // Collect unique mint addresses that need metadata
    const mintsNeedingMetadata = new Set<string>();
    
    deals?.forEach(deal => {
      if (!deal.token_offered_name || !deal.token_offered_symbol) {
        mintsNeedingMetadata.add(deal.token_mint_offered);
      }
      if (!deal.token_requested_name || !deal.token_requested_symbol) {
        mintsNeedingMetadata.add(deal.token_mint_requested);
      }
    });

    console.log(`Found ${mintsNeedingMetadata.size} unique tokens needing metadata`);

    if (mintsNeedingMetadata.size === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No tokens need metadata updates',
        updated: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch metadata for all missing tokens
    const { data: metadataResponse, error: metadataError } = await supabaseClient.functions
      .invoke('fetch-token-metadata', {
        body: { mintAddresses: Array.from(mintsNeedingMetadata) }
      });

    if (metadataError) {
      throw new Error(`Failed to fetch metadata: ${metadataError.message}`);
    }

    const tokenMetadata = metadataResponse.metadata || [];
    console.log(`Fetched metadata for ${tokenMetadata.length} tokens`);

    // Update deals with the fetched metadata
    let updatedCount = 0;
    
    for (const token of tokenMetadata) {
      if (!token.mintAddress || (!token.name && !token.symbol)) continue;

      // Update deals where this token is offered
      const { error: updateOfferedError } = await supabaseClient
        .from('deals')
        .update({
          token_offered_name: token.name,
          token_offered_symbol: token.symbol,
          token_offered_image: token.image
        })
        .eq('token_mint_offered', token.mintAddress)
        .or('token_offered_name.is.null,token_offered_symbol.is.null');

      if (updateOfferedError) {
        console.warn(`Failed to update offered token ${token.mintAddress}:`, updateOfferedError);
      } else {
        updatedCount++;
      }

      // Update deals where this token is requested
      const { error: updateRequestedError } = await supabaseClient
        .from('deals')
        .update({
          token_requested_name: token.name,
          token_requested_symbol: token.symbol,
          token_requested_image: token.image
        })
        .eq('token_mint_requested', token.mintAddress)
        .or('token_requested_name.is.null,token_requested_symbol.is.null');

      if (updateRequestedError) {
        console.warn(`Failed to update requested token ${token.mintAddress}:`, updateRequestedError);
      } else {
        updatedCount++;
      }
    }

    console.log(`Successfully updated ${updatedCount} deal token metadata entries`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Successfully backfilled metadata for ${tokenMetadata.length} tokens`,
      tokensProcessed: tokenMetadata.length,
      dealsUpdated: updatedCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in backfill-token-metadata function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});