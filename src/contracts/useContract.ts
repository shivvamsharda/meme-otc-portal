import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { MEMEOTC_CONFIG } from "./config";
import { CreateDealParams, Deal } from "./types";
import { toast } from "@/hooks/use-toast";
import IDL from "./memeotc_contract.json";
import { MemeotcContract } from "./memeotc_contract";

export const useContract = () => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const isAuthenticated = wallet.connected && wallet.publicKey;

  const getProgram = () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error("Wallet not connected");
    }

    const provider = new AnchorProvider(
      connection,
      wallet as any,
      { commitment: "confirmed" }
    );

    const program = new Program<MemeotcContract>(
      IDL as MemeotcContract, 
      provider
    );

    return program;
  };

  const createDeal = async (params: CreateDealParams) => {
    if (!isAuthenticated || !wallet.publicKey) {
      throw new Error("Please connect your wallet first");
    }

    try {
      const program = getProgram();
      
      // Derive PDAs
      const [platformPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("platform")],
        program.programId
      );

      const [dealPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("deal"), new BN(params.dealId).toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      const [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), new BN(params.dealId).toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      const [escrowAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), new BN(params.dealId).toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      // Get maker's token account
      const makerTokenAccount = await getAssociatedTokenAddress(
        new PublicKey(params.tokenMintOffered),
        wallet.publicKey
      );

      // Create deal transaction
      const tx = await program.methods
        .createDeal(
          new BN(params.dealId),
          new PublicKey(params.tokenMintOffered),
          new BN(params.amountOffered),
          new PublicKey(params.tokenMintRequested),
          new BN(params.amountRequested),
          new BN(params.expiryTimestamp)
        )
        .accounts({
          platform: platformPda,
          deal: dealPda,
          escrowAccount: escrowPda,
          escrowAuthority: escrowAuthority,
          maker: wallet.publicKey,
          makerTokenAccount: makerTokenAccount,
          tokenMintOffered: new PublicKey(params.tokenMintOffered),
          tokenMintRequested: new PublicKey(params.tokenMintRequested),
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();

      toast({
        title: "Deal Created Successfully!",
        description: `Transaction: ${tx}`,
        className: "border-green-200 bg-green-50 text-green-900",
      });

      return { success: true, signature: tx };
    } catch (error) {
      console.error("Error creating deal:", error);
      toast({
        title: "Failed to Create Deal",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      throw error;
    }
  };

  const acceptDeal = async (dealId: number) => {
    if (!isAuthenticated || !wallet.publicKey) {
      throw new Error("Please connect your wallet first");
    }

    try {
      const program = getProgram();
      
      // First, get the deal account to access its data
      const [dealPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("deal"), new BN(dealId).toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      const dealAccount = await program.account.Deal.fetch(dealPda);
      
      // Derive other PDAs
      const [platformPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("platform")],
        program.programId
      );

      const [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), new BN(dealId).toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      const [escrowAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), new BN(dealId).toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      // Get token accounts
      const takerTokenAccountRequested = await getAssociatedTokenAddress(
        dealAccount.tokenMintOffered,
        wallet.publicKey
      );

      const takerTokenAccountOffered = await getAssociatedTokenAddress(
        dealAccount.tokenMintRequested,
        wallet.publicKey
      );

      const makerTokenAccountRequested = await getAssociatedTokenAddress(
        dealAccount.tokenMintRequested,
        dealAccount.maker
      );

      // Platform fee account (using maker's offered token)
      const platformFeeAccount = await getAssociatedTokenAddress(
        dealAccount.tokenMintOffered,
        platformPda
      );

      const tx = await program.methods
        .acceptDeal()
        .accounts({
          platform: platformPda,
          deal: dealPda,
          escrowAccount: escrowPda,
          escrowAuthority: escrowAuthority,
          taker: wallet.publicKey,
          takerTokenAccountRequested: takerTokenAccountRequested,
          takerTokenAccountOffered: takerTokenAccountOffered,
          makerTokenAccountRequested: makerTokenAccountRequested,
          platformFeeAccount: platformFeeAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        } as any)
        .rpc();

      toast({
        title: "Deal Accepted Successfully!",
        description: `Transaction: ${tx}`,
        className: "border-green-200 bg-green-50 text-green-900",
      });

      return { success: true, signature: tx };
    } catch (error) {
      console.error("Error accepting deal:", error);
      toast({
        title: "Failed to Accept Deal",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      throw error;
    }
  };

  const cancelDeal = async (dealId: number) => {
    if (!isAuthenticated || !wallet.publicKey) {
      throw new Error("Please connect your wallet first");
    }

    try {
      const program = getProgram();
      
      // Get the deal account first
      const [dealPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("deal"), new BN(dealId).toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      const dealAccount = await program.account.Deal.fetch(dealPda);

      // Derive PDAs
      const [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), new BN(dealId).toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      const [escrowAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), new BN(dealId).toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      // Get maker's token account
      const makerTokenAccount = await getAssociatedTokenAddress(
        dealAccount.tokenMintOffered,
        wallet.publicKey
      );

      const tx = await program.methods
        .cancelDeal()
        .accounts({
          deal: dealPda,
          escrowAccount: escrowPda,
          escrowAuthority: escrowAuthority,
          maker: wallet.publicKey,
          makerTokenAccount: makerTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        } as any)
        .rpc();

      toast({
        title: "Deal Cancelled Successfully!",
        description: `Transaction: ${tx}`,
        className: "border-green-200 bg-green-50 text-green-900",
      });

      return { success: true, signature: tx };
    } catch (error) {
      console.error("Error cancelling deal:", error);
      toast({
        title: "Failed to Cancel Deal",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getDeals = async (): Promise<Deal[]> => {
    try {
      const program = getProgram();
      
      // Fetch all deal accounts
      const dealAccounts = await program.account.Deal.all();
      
      return dealAccounts.map((account) => ({
        dealId: account.account.dealId.toNumber(),
        maker: account.account.maker,
        taker: account.account.taker,
        tokenMintOffered: account.account.tokenMintOffered,
        amountOffered: account.account.amountOffered.toNumber(),
        tokenMintRequested: account.account.tokenMintRequested,
        amountRequested: account.account.amountRequested.toNumber(),
        status: account.account.status,
        createdAt: account.account.createdAt.toNumber(),
        expiryTimestamp: account.account.expiryTimestamp.toNumber(),
        completedAt: account.account.completedAt.toNumber(),
        escrowBump: account.account.escrowBump,
      }));
    } catch (error) {
      console.error("Error fetching deals:", error);
      return [];
    }
  };

  const getMyDeals = async (): Promise<Deal[]> => {
    if (!wallet.publicKey) return [];
    
    try {
      const allDeals = await getDeals();
      return allDeals.filter(deal => 
        deal.maker.equals(wallet.publicKey!) || 
        deal.taker.equals(wallet.publicKey!)
      );
    } catch (error) {
      console.error("Error fetching my deals:", error);
      return [];
    }
  };

  return {
    isAuthenticated,
    createDeal,
    acceptDeal,
    cancelDeal,
    getDeals,
    getMyDeals,
  };
};