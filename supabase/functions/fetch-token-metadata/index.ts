import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createUmi } from "https://esm.sh/@metaplex-foundation/umi-bundle-defaults@0.9.2";
import { publicKey } from "https://esm.sh/@metaplex-foundation/umi@0.9.2";
import { findMetadataPda, fetchMetadata } from "https://esm.sh/@metaplex-foundation/mpl-token-metadata@3.2.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TokenMetadata {
  name?: string;
  symbol?: string;
  image?: string;
}

async function fetchMetaplexMetadata(mintAddress: string): Promise<TokenMetadata> {
  try {
    const rpcEndpoint = Deno.env.get('HELIUS_SOLANA_DEVNET_RPC') || 'https://api.devnet.solana.com';
    const umi = createUmi(rpcEndpoint);
    
    const mint = publicKey(mintAddress);
    const metadataPda = findMetadataPda(umi, { mint });
    
    const metadata = await fetchMetadata(umi, metadataPda);
    
    let imageUri = metadata.uri;
    
    // If metadata has a URI, fetch the JSON to get the image
    if (metadata.uri) {
      try {
        const metadataResponse = await fetch(metadata.uri);
        if (metadataResponse.ok) {
          const metadataJson = await metadataResponse.json();
          imageUri = metadataJson.image || metadata.uri;
        }
      } catch (uriError) {
        console.log('Failed to fetch metadata URI:', uriError);
        // Continue with the original URI
      }
    }
    
    return {
      name: metadata.name,
      symbol: metadata.symbol,
      image: imageUri
    };
  } catch (error) {
    console.log('Metaplex metadata fetch failed:', error);
    return {};
  }
}

async function fetchTokenMetadata(mintAddress: string): Promise<TokenMetadata> {
  try {
    // 1. Try Metaplex Token Metadata Program first (on-chain, authoritative)
    const metaplexData = await fetchMetaplexMetadata(mintAddress);
    if (metaplexData.name && metaplexData.symbol) {
      return metaplexData;
    }

    // 2. Try Jupiter API as secondary (curated list of popular tokens)
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

    // 3. Try Helius API as tertiary fallback
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

    // 4. Final fallback to generated display names
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