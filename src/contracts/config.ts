import { PublicKey } from "@solana/web3.js";

export const MEMEOTC_PROGRAM_ID = "6Ev9xMEALPAAmhYgonzNBmkPwrYTGryBebQvtgPVgznQ";
export const NETWORK = "mainnet-beta";
export const PLATFORM_WALLET = "AFENnEJjveLVhLTNABbzWToTbLKUDF54CkDGGzyBhJuM";
export const RPC_URL = "https://mainnet.helius-rpc.com/?api-key=8d5d0812-ab2e-4699-808a-a245f1880138";

export const MEMEOTC_CONFIG = {
  programId: new PublicKey(MEMEOTC_PROGRAM_ID),
  network: NETWORK,
  rpcUrl: RPC_URL,
  platformWallet: new PublicKey(PLATFORM_WALLET),
};
