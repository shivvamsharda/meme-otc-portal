import { PublicKey } from "@solana/web3.js";

export interface Deal {
  dealId: number;
  maker: PublicKey;
  taker: PublicKey;
  tokenMintOffered: PublicKey;
  amountOffered: number;
  tokenMintRequested: PublicKey;
  amountRequested: number;
  status: DealStatus;
  createdAt: number;
  expiryTimestamp: number;
  completedAt: number;
  escrowBump: number;
}

export interface Platform {
  authority: PublicKey;
  totalDeals: number;
  completedDeals: number;
  platformFeeBps: number;
  isPaused: boolean;
}

export type DealStatus = 
  | { Open: {} }
  | { InProgress: {} }
  | { Completed: {} }
  | { Cancelled: {} };

export interface CreateDealParams {
  dealId: number;
  tokenMintOffered: string;
  amountOffered: number;
  tokenMintRequested: string;
  amountRequested: number;
  expiryTimestamp: number;
}
