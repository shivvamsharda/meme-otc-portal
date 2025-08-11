import { PublicKey } from "@solana/web3.js";
import { NATIVE_MINT } from "@solana/spl-token";

export interface Listing {
  seller: PublicKey;
  tokenMint: PublicKey;
  tokenAmount: number;
  totalPrice: number; // CHANGED: Direct total price, no pricePerToken
  createdAt: number;
  expiresAt: number;
  isActive: boolean;
  listingNonce: number;
  bump: number;
  escrowBump: number;
}

export interface CreateListingParams {
  tokenAmount: number;
  totalPrice: number; // CHANGED: Direct total price
  durationHours: number;
  listingNonce: number;
  tokenMint: string;
}

export interface ListingCreatedEvent {
  listingId: PublicKey;
  seller: PublicKey;
  tokenMint: PublicKey;
  tokenAmount: number;
  totalPrice: number; // CHANGED
  expiresAt: number;
}

export interface ListingPurchasedEvent {
  listingId: PublicKey;
  buyer: PublicKey;
  seller: PublicKey;
  tokenAmount: number;
  totalPrice: number; // CHANGED
  platformFee: number;
}

export interface ListingCancelledEvent {
  listingId: PublicKey;
  seller: PublicKey;
}

// UI-facing Deal shape used across pages
export interface Deal {
  dealId: string; // Listing PDA as string
  maker: PublicKey;
  tokenMintOffered: PublicKey;
  tokenMintRequested: PublicKey; // WSOL for SOL payments
  amountOffered: number;
  amountRequested: number;
  createdAt: number; // seconds
  expiryTimestamp: number; // seconds
  status: { Open?: true; InProgress?: true; Completed?: true; Cancelled?: true };
  completedAt: number; // 0 if not completed
}

// Map on-chain listing account to UI Deal (handles snake_case and camelCase)
export const mapListingToDeal = (listingId: PublicKey, listing: any): Deal => {
  const seller = listing.seller as PublicKey;
  const tokenMint = (listing.tokenMint || listing.token_mint) as PublicKey;
  const tokenAmount = (listing.tokenAmount || listing.token_amount) as number;
  const totalPrice = (listing.totalPrice || listing.total_price) as number;
  const createdAt = (listing.createdAt || listing.created_at) as number;
  const expiresAt = (listing.expiresAt || listing.expires_at) as number;
  const isActive = (listing.isActive ?? listing.is_active) as boolean;

  return {
    dealId: listingId.toString(),
    maker: seller,
    tokenMintOffered: tokenMint,
    tokenMintRequested: NATIVE_MINT, // represent SOL requests as WSOL mint
    amountOffered: tokenAmount,
    amountRequested: totalPrice,
    createdAt,
    expiryTimestamp: expiresAt,
    status: isActive ? { Open: true } : { Cancelled: true },
    completedAt: 0,
  };
};

// Helper function to calculate effective price per token for display
export const calculatePricePerToken = (totalPrice: number, tokenAmount: number, decimals: number = 6): number => {
  const actualTokens = tokenAmount / Math.pow(10, decimals);
  const priceInSOL = totalPrice / Math.pow(10, 9);
  return priceInSOL / actualTokens;
};

