export interface TokenMetadata {
  mint: string;
  symbol: string;
  name: string;
  logoURI?: string;
  decimals?: number;
}

interface JupiterToken {
  address: string;
  symbol: string;
  name: string;
  logoURI?: string;
  decimals: number;
}

interface DexScreenerToken {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  info?: {
    imageUrl?: string;
  };
}

class TokenMetadataService {
  private cache = new Map<string, TokenMetadata>();
  private jupiterTokens: Map<string, JupiterToken> = new Map();
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    try {
      const response = await fetch('https://token.jup.ag/strict');
      const tokens: JupiterToken[] = await response.json();
      
      tokens.forEach(token => {
        this.jupiterTokens.set(token.address, token);
      });
      
      this.initialized = true;
    } catch (error) {
      console.warn('Failed to initialize Jupiter token list:', error);
    }
  }

  async getTokenMetadata(mintAddress: string): Promise<TokenMetadata | null> {
    // Check cache first
    if (this.cache.has(mintAddress)) {
      return this.cache.get(mintAddress)!;
    }

    // Initialize Jupiter tokens if needed
    await this.initialize();

    // Try Jupiter first
    const jupiterToken = this.jupiterTokens.get(mintAddress);
    if (jupiterToken) {
      const metadata: TokenMetadata = {
        mint: mintAddress,
        symbol: jupiterToken.symbol,
        name: jupiterToken.name,
        logoURI: jupiterToken.logoURI,
        decimals: jupiterToken.decimals,
      };
      this.cache.set(mintAddress, metadata);
      return metadata;
    }

    // Fallback to DexScreener
    try {
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mintAddress}`);
      const data = await response.json();
      
      if (data.pairs && data.pairs.length > 0) {
        const pair = data.pairs[0];
        const metadata: TokenMetadata = {
          mint: mintAddress,
          symbol: pair.baseToken.symbol,
          name: pair.baseToken.name,
          logoURI: pair.info?.imageUrl,
        };
        this.cache.set(mintAddress, metadata);
        return metadata;
      }
    } catch (error) {
      console.warn('Failed to fetch from DexScreener:', error);
    }

    return null;
  }

  async getMultipleTokenMetadata(mintAddresses: string[]): Promise<Map<string, TokenMetadata>> {
    const results = new Map<string, TokenMetadata>();
    
    await Promise.allSettled(
      mintAddresses.map(async (mint) => {
        const metadata = await this.getTokenMetadata(mint);
        if (metadata) {
          results.set(mint, metadata);
        }
      })
    );

    return results;
  }
}

export const tokenMetadataService = new TokenMetadataService();