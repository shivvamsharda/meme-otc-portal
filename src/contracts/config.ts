import { PublicKey } from "@solana/web3.js";

export const MEMEOTC_PROGRAM_ID = "6Ev9xMEALPAAmhYgonzNBmkPwrYTGryBebQvtgPVgznQ";
export const NETWORK = "devnet";
export const PLATFORM_WALLET = "AFENnEJjveLVhLTNABbzWToTbLKUDF54CkDGGzyBhJuM";
export const RPC_URL = "https://devnet.helius-rpc.com/?api-key=ab1858fe-4f28-46e6-b2c8-5fe8119f9852";

export const MEMEOTC_CONFIG = {
  programId: new PublicKey(MEMEOTC_PROGRAM_ID),
  network: NETWORK,
  rpcUrl: RPC_URL,
  platformWallet: new PublicKey(PLATFORM_WALLET),
};
