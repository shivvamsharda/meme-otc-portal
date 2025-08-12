import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TokenMetadata {
  name?: string;
  symbol?: string;
  image?: string;
}

async function fetchTokenMetadata(mintAddress: string): Promise<TokenMetadata> {
  try {
    // Try Jupiter API first (most comprehensive for popular tokens)
    const jupiterResponse = await fetch(`https://token.jup.ag/strict`);
    const jupiterTokens = await jupiterResponse.json();
    
    const jupiterToken = jupiterTokens.find((token: any) => token.address === mintAddress);
    if (jupiterToken) {
      return {
        name: jupiterToken.name,
        symbol: jupiterToken.symbol,
        image: jupiterToken.logoURI
      };
    }

    // Try Helius API as fallback
    const heliusResponse = await fetch(`https://api.helius.xyz/v0/token-metadata?api-key=${Deno.env.get('HELIUS_API_KEY')}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mintAccounts: [mintAddress]
      })
    });

    if (heliusResponse.ok) {
      const heliusData = await heliusResponse.json();
      if (heliusData.length > 0) {
        const token = heliusData[0];
        return {
          name: token.onChainMetadata?.metadata?.name || token.offChainMetadata?.metadata?.name,
          symbol: token.onChainMetadata?.metadata?.symbol || token.offChainMetadata?.metadata?.symbol,
          image: token.offChainMetadata?.metadata?.image
        };
      }
    }

    // Fallback to basic token info
    return {
      name: `Token ${mintAddress.slice(0, 8)}...`,
      symbol: `${mintAddress.slice(0, 4)}...`,
      image: undefined
    };

  } catch (error) {
    console.error('Error fetching token metadata:', error);
    return {
      name: `Token ${mintAddress.slice(0, 8)}...`,
      symbol: `${mintAddress.slice(0, 4)}...`,
      image: undefined
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mintAddresses } = await req.json();

    if (!Array.isArray(mintAddresses)) {
      return new Response(
        JSON.stringify({ error: 'mintAddresses must be an array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const metadataPromises = mintAddresses.map(async (mintAddress: string) => {
      const metadata = await fetchTokenMetadata(mintAddress);
      return { mintAddress, ...metadata };
    });

    const results = await Promise.all(metadataPromises);

    return new Response(
      JSON.stringify({ tokens: results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-token-metadata function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});