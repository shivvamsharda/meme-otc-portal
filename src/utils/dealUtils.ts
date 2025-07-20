
import { PublicKey } from '@solana/web3.js';

// Generate a more robust unique deal ID
export const generateUniqueDealId = (walletAddress: string): number => {
  const timestamp = Math.floor(Date.now() / 1000);
  const addressHash = walletAddress.slice(-8); // Last 8 chars of address
  const random = Math.floor(Math.random() * 1000);
  
  // Combine timestamp, address hash, and random for uniqueness
  const addressNum = parseInt(addressHash, 16) % 10000;
  return timestamp * 10000 + addressNum + random;
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
    if (parseInt(params.expiryDays) < 1 || parseInt(params.expiryDays) > 30) return "Expiry must be between 1-30 days";
    
    return null;
  } catch {
    return "Invalid token mint address";
  }
};
