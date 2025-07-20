export const MEMEOTC_CONFIG = {
  programId: "2yT4Gd7NV9NDcetuoBZsdA317Ko3JAZDGx6RCCaTATfJ",
  network: "devnet",
  platformPDA: "AykfyQgVZQW4Ncz1C8BqWJqpzhDLmkYuxcn4w9WsX6UL",
  rpcUrl: "https://devnet.helius-rpc.com/?api-key=ab1858fe-4f28-46e6-b2c8-5fe8119f9852", // Or your Helius URL
};

export const DEAL_STATUSES = {
  OPEN: { Open: {} },
  IN_PROGRESS: { InProgress: {} },
  COMPLETED: { Completed: {} },
  CANCELLED: { Cancelled: {} },
} as const;
