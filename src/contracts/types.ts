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
  tokenAmount: number;
  totalPrice: number;
  durationHours: number;
  listingNonce: number;
  tokenMint: string;
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
