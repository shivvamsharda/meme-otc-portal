import { PublicKey } from "@solana/web3.js";

export interface Listing {
  seller: PublicKey;
  tokenMint: PublicKey;
  tokenAmount: number;
  pricePerToken: number;
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
  pricePerToken: number;
  durationHours: number;
  listingNonce: number;
  tokenMint: string;
}

export interface ListingCreatedEvent {
  listingId: PublicKey;
  seller: PublicKey;
  tokenMint: PublicKey;
  tokenAmount: number;
  pricePerToken: number;
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
