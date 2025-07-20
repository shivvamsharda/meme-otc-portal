export const MEMEOTC_PROGRAM_ID = "2yT4Gd7NV9NDcetuoBZsdA317Ko3JAZDGx6RCCaTATfJ";
export const NETWORK = "devnet";
export const PLATFORM_PDA = "AykfyQgVZQW4Ncz1C8BqWJqpzhDLmkYuxcn4w9WsX6UL";

// Function to get RPC URL (will use Helius if available, fallback to default)
export const getRpcUrl = async (): Promise<string> => {
  try {
    const response = await fetch('/api/get-rpc-config');
    const data = await response.json();
    return data.rpcUrl || "https://api.devnet.solana.com";
  } catch (error) {
    console.warn('Failed to fetch custom RPC, using default');
    return "https://api.devnet.solana.com";
  }
};
