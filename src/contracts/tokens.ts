import { NETWORK } from "@/contracts/config";

// Solana Devnet token configuration
export const DEVNET_ACCEPTED_TOKENS = [
  {
    symbol: "SOL",
    name: "Solana",
    mint: "So11111111111111111111111111111111111111112", // Wrapped SOL
    decimals: 9,
    isNative: true
  },
  {
    symbol: "USDC",
    name: "USD Coin (Devnet)",
    mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", // USDC devnet
    decimals: 6,
    isNative: false
  },
  {
    symbol: "USDT",
    name: "Tether USD (Devnet)",
    mint: "EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS", // USDT devnet  
    decimals: 6,
    isNative: false
  }
];

// Solana Mainnet token configuration
export const MAINNET_ACCEPTED_TOKENS = [
  {
    symbol: "SOL",
    name: "Solana",
    mint: "So11111111111111111111111111111111111111112", // Wrapped SOL (same mint on mainnet)
    decimals: 9,
    isNative: true
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC mainnet
    decimals: 6,
    isNative: false
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // USDT mainnet
    decimals: 6,
    isNative: false
  }
];

// Network-aware accepted tokens
export const ACCEPTED_TOKENS = NETWORK === "mainnet-beta" ? MAINNET_ACCEPTED_TOKENS : DEVNET_ACCEPTED_TOKENS;

// Helper function to get token by symbol
export const getTokenBySymbol = (symbol: string) => {
  return ACCEPTED_TOKENS.find(token => token.symbol === symbol);
};

// Helper function to get token by mint address
export const getTokenByMint = (mintAddress: string) => {
  return ACCEPTED_TOKENS.find(token => token.mint === mintAddress);
};
