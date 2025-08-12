import { PublicKey } from "@solana/web3.js";

export interface Listing {
  seller: PublicKey;
  tokenMint: PublicKey;
  tokenAmount: number;
  totalPrice: number;
  createdAt: number;
  expiresAt: number;
  isActive: boolean;
  listingNonce: number;
  bump: number;
  escrowBump: number;
}

export interface CreateListingParams {
  tokenAmount: string; // base units as string to avoid precision loss
  totalPrice: string; // lamports as string to avoid float rounding
  durationHours: number;
  listingNonce: number;
  tokenMint: string;
  amountOfferedDisplay?: number;
  amountRequestedDisplay?: number;
  // Token metadata for database storage
  tokenOfferedName?: string;
  tokenOfferedSymbol?: string;
  tokenOfferedImage?: string;
  tokenRequestedName?: string;
  tokenRequestedSymbol?: string;
  tokenRequestedImage?: string;
}

export interface ListingCreatedEvent {
  listingId: PublicKey;
  seller: PublicKey;
  tokenMint: PublicKey;
  tokenAmount: number;
  totalPrice: number;
  expiresAt: number;
}

export interface ListingPurchasedEvent {
  listingId: PublicKey;
  buyer: PublicKey;
  seller: PublicKey;
  tokenAmount: number;
  totalPrice: number;
  platformFee: number;
}

export interface ListingCancelledEvent {
  listingId: PublicKey;
  seller: PublicKey;
}

// Helper function to calculate effective price per token for display
export const calculatePricePerToken = (totalPrice: number, tokenAmount: number, decimals: number = 6): number => {
  const actualTokens = tokenAmount / Math.pow(10, decimals);
  const priceInSOL = totalPrice / Math.pow(10, 9);
  return priceInSOL / actualTokens;
};

export interface Deal extends Listing {
  dealId?: string;
  deal_id?: number; // Database numeric ID for fallback lookup
  maker?: PublicKey;
  status?: Record<string, unknown>;
  expiryTimestamp?: number;
  amountOffered?: number;
  tokenMintOffered?: PublicKey;
  amountRequested?: number;
  tokenMintRequested?: PublicKey;
  completedAt?: number | null;
  amountOfferedDisplay?: number;
  amountRequestedDisplay?: number;
  tokenOfferedName?: string;
  tokenOfferedSymbol?: string;
  tokenOfferedImage?: string;
  tokenRequestedName?: string;
  tokenRequestedSymbol?: string;
  tokenRequestedImage?: string;
}