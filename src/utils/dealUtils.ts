
import { PublicKey } from '@solana/web3.js';
import { getTokenByMint } from '@/contracts/tokens';

// Generate a more robust unique deal ID with validation
export const generateUniqueDealId = (walletAddress: string): number => {
  // Validate wallet address input
  if (!walletAddress || typeof walletAddress !== 'string' || walletAddress.length < 8) {
    console.warn("Invalid wallet address provided, using timestamp-only ID");
    return Date.now();
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const addressHash = walletAddress.slice(-8); // Last 8 chars of address
    const random = Math.floor(Math.random() * 1000);
    
    // Combine timestamp, address hash, and random for uniqueness
    const addressNum = parseInt(addressHash, 16) % 10000;
    
    // Validate that we got a valid number from the hex parsing
    if (isNaN(addressNum)) {
      console.warn("Failed to parse address hash, using timestamp-only ID");
      return timestamp * 1000 + random;
    }
    
    const dealId = timestamp * 10000 + addressNum + random;
    
    // Final validation
    if (isNaN(dealId) || dealId <= 0) {
      console.error("Generated invalid deal ID, falling back to timestamp");
      return Date.now();
    }
    
    return dealId;
  } catch (error) {
    console.error("Error generating deal ID:", error);
    return Date.now(); // Fallback to simple timestamp
  }
};

// Check if error is due to already processed transaction
export const isAlreadyProcessedError = (error: any): boolean => {
  const errorMessage = error?.message || error?.transactionMessage || '';
  return errorMessage.includes('already been processed') || 
         errorMessage.includes('already processed') ||
         errorMessage.includes('duplicate transaction');
};

// Extract transaction signature from various error formats
export const extractSignatureFromError = (error: any): string | null => {
  if (error?.signature) return error.signature;
  if (error?.txid) return error.txid;
  
  // Try to extract from error message
  const message = error?.message || '';
  const signatureMatch = message.match(/signature[:\s]+([A-Za-z0-9]{87,88})/i);
  return signatureMatch ? signatureMatch[1] : null;
};

// Validate deal parameters before submission
export const validateDealParams = (params: {
  tokenMintOffered: string;
  amountOffered: string;
  tokenMintRequested: string;
  amountRequested: string;
  expiryDays: string;
}): string | null => {
  try {
    new PublicKey(params.tokenMintOffered);
    new PublicKey(params.tokenMintRequested);
    
    if (parseFloat(params.amountOffered) <= 0) return "Offered amount must be greater than 0";
    if (parseFloat(params.amountRequested) <= 0) return "Requested amount must be greater than 0";
    if (parseInt(params.expiryDays) < 1 || parseInt(params.expiryDays) > 365) return "Expiry must be between 1-365 days";
    
    return null;
  } catch {
    return "Invalid token mint address";
  }
};

// Get token symbol from mint address
export const getTokenSymbol = (mintAddress: string): string => {
  const token = getTokenByMint(mintAddress);
  return token ? token.symbol : 'Unknown Token';
};

// Get token display name from mint address
export const getTokenDisplayName = (mintAddress: string): string => {
  const token = getTokenByMint(mintAddress);
  return token ? `${token.symbol} (${token.name})` : `Unknown Token (${mintAddress.slice(0, 8)}...)`;
};

// Convert a human-readable decimal amount to base units precisely using string math
export const decimalToBaseUnits = (amount: string | number, decimals: number): string => {
  const s = String(amount).trim();
  if (!s || s === '.' || s === '-' || isNaN(Number(s))) return '0';
  const negative = s.startsWith('-');
  const [wholeRaw, fracRaw = ''] = (negative ? s.slice(1) : s).split('.');
  const whole = wholeRaw.replace(/\D/g, '') || '0';
  const frac = fracRaw.replace(/\D/g, '').slice(0, decimals).padEnd(decimals, '0');
  const base = (BigInt(whole) * (BigInt(10) ** BigInt(decimals))) + BigInt(frac || '0');
  return (negative ? '-' : '') + base.toString();
};
