import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { MEMEOTC_CONFIG } from "./config";
import { CreateDealParams, Deal } from "./types";
import { toast } from "@/hooks/use-toast";
import { useDatabase } from "@/hooks/useDatabase";
import { isAlreadyProcessedError, extractSignatureFromError } from "@/utils/dealUtils";
import { MemeotcContract } from "./memeotc_contract";
import IDL from "./memeotc_contract.json";

export const useContract = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const database = useDatabase();

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

    // Use the JSON IDL with proper type casting
    const program = new Program<MemeotcContract>(
      IDL as unknown as MemeotcContract,
      provider
    );

    return program;
  };

  const createDeal = async (params: CreateDealParams) => {
    if (!isAuthenticated || !wallet.publicKey) {
      throw new Error("Please connect your wallet first");
    }

    console.log("Creating deal with params:", params);

    // Check if deal already exists in database to prevent duplicates
    const existingDeal = await database.getDealById(params.dealId);
    if (existingDeal) {
      console.log("Deal already exists in database:", existingDeal);
      
      if (existingDeal.blockchain_synced && existingDeal.transaction_signature) {
        toast({
          title: "Deal Already Created",
          description: `This deal already exists with signature: ${existingDeal.transaction_signature}`,
          className: "border-blue-200 bg-blue-50 text-blue-900",
        });
        return { success: true, signature: existingDeal.transaction_signature };
      }
    }

    // Store deal in database first if it doesn't exist
    if (!existingDeal) {
      try {
        await database.createDeal({
          dealId: params.dealId,
          makerAddress: wallet.publicKey.toString(),
          tokenMintOffered: params.tokenMintOffered,
          amountOffered: params.amountOffered,
          tokenMintRequested: params.tokenMintRequested,
          amountRequested: params.amountRequested,
          expiryTimestamp: params.expiryTimestamp,
        });
        console.log("Deal created in database");
      } catch (dbError) {
        console.error("Database error:", dbError);
        // Continue with blockchain transaction even if database fails
      }
    }

    // Log the transaction attempt
    await database.logTransaction({
      dealId: params.dealId,
      transactionType: 'create',
      userAddress: wallet.publicKey.toString(),
      status: 'pending'
    });

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

      console.log("Submitting blockchain transaction...");

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

      console.log("Blockchain transaction successful:", tx);

      // Update database with successful transaction
      await database.updateDealWithTransaction(params.dealId, tx, true);
      await database.updateTransactionStatus(params.dealId, 'create', 'confirmed', tx);

      toast({
        title: "Deal Created Successfully!",
        description: `Transaction: ${tx}`,
        className: "border-green-200 bg-green-50 text-green-900",
      });

      return { success: true, signature: tx };
    } catch (error) {
      console.error("Error creating deal:", error);
      
      let errorMessage = "Unknown error occurred";
      let signature = null;

      // Handle "already processed" errors differently
      if (isAlreadyProcessedError(error)) {
        console.log("Transaction already processed, checking for signature...");
        signature = extractSignatureFromError(error);
        
        if (signature) {
          // Update database with the found signature
          await database.updateDealWithTransaction(params.dealId, signature, true);
          await database.updateTransactionStatus(params.dealId, 'create', 'confirmed', signature);
          
          toast({
            title: "Deal Created Successfully!",
            description: "Your deal was already processed successfully",
            className: "border-green-200 bg-green-50 text-green-900",
          });
          
          return { success: true, signature };
        } else {
          errorMessage = "Deal may have been created successfully. Please check your deals.";
          
          // Mark as potentially successful
          await database.updateDealStatus(params.dealId, 'Open', {
            blockchain_synced: false
          });
          
          toast({
            title: "Deal Possibly Created",
            description: errorMessage,
            className: "border-yellow-200 bg-yellow-50 text-yellow-900",
          });
          
          return { success: true, signature: null };
        }
      } else {
        errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      }
      
      // Update database with failed transaction
      await database.updateTransactionStatus(
        params.dealId, 
        'create', 
        'failed', 
        signature, 
        errorMessage
      );
      
      toast({
        title: "Failed to Create Deal",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const acceptDeal = async (dealId: number) => {
    if (!isAuthenticated || !wallet.publicKey) {
      throw new Error("Please connect your wallet first");
    }

    // Log the transaction attempt
    await database.logTransaction({
      dealId,
      transactionType: 'accept',
      userAddress: wallet.publicKey.toString(),
      status: 'pending'
    });

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

      console.log("Accepting deal with program methods:", program.methods);

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

      // Update database with successful transaction
      await database.updateDealStatus(dealId, 'Completed', {
        taker_address: wallet.publicKey.toString(),
        completed_at: new Date().toISOString(),
        transaction_signature: tx,
        blockchain_synced: true
      });
      await database.updateTransactionStatus(dealId, 'accept', 'confirmed', tx);

      toast({
        title: "Deal Accepted Successfully!",
        description: `Transaction: ${tx}`,
        className: "border-green-200 bg-green-50 text-green-900",
      });

      return { success: true, signature: tx };
    } catch (error) {
      console.error("Error accepting deal:", error);
      
      // Update database with failed transaction
      await database.updateTransactionStatus(
        dealId, 
        'accept', 
        'failed', 
        undefined, 
        error instanceof Error ? error.message : "Unknown error occurred"
      );
      
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

    // Log the transaction attempt
    await database.logTransaction({
      dealId,
      transactionType: 'cancel',
      userAddress: wallet.publicKey.toString(),
      status: 'pending'
    });

    try {
      const program = getProgram();
      
      console.log("Cancel deal - program methods available:", Object.keys(program.methods));
      
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

      console.log("Calling cancelDeal method...");

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

      // Update database with successful transaction
      await database.updateDealStatus(dealId, 'Cancelled', {
        transaction_signature: tx,
        blockchain_synced: true
      });
      await database.updateTransactionStatus(dealId, 'cancel', 'confirmed', tx);

      toast({
        title: "Deal Cancelled Successfully!",
        description: `Transaction: ${tx}`,
        className: "border-green-200 bg-green-50 text-green-900",
      });

      return { success: true, signature: tx };
    } catch (error) {
      console.error("Error cancelling deal:", error);
      
      // Update database with failed transaction
      await database.updateTransactionStatus(
        dealId, 
        'cancel', 
        'failed', 
        undefined, 
        error instanceof Error ? error.message : "Unknown error occurred"
      );
      
      toast({
        title: "Failed to Cancel Deal",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getDeals = async (openOnly: boolean = false): Promise<Deal[]> => {
    try {
      // Get deals from database for fast loading
      const dbDeals = await database.getDeals(openOnly);
      
      return dbDeals.map((deal) => {
        // Map status string to DealStatus type
        const getStatusObject = (status: string) => {
          switch (status) {
            case 'Open': return { Open: {} };
            case 'InProgress': return { InProgress: {} };
            case 'Completed': return { Completed: {} };
            case 'Cancelled': return { Cancelled: {} };
            default: return { Open: {} };
          }
        };

        return {
          dealId: deal.deal_id,
          maker: new PublicKey(deal.maker_address),
          taker: deal.taker_address ? new PublicKey(deal.taker_address) : new PublicKey("11111111111111111111111111111111"), // Use system program as null placeholder
          tokenMintOffered: new PublicKey(deal.token_mint_offered),
          amountOffered: deal.amount_offered,
          tokenMintRequested: new PublicKey(deal.token_mint_requested),
          amountRequested: deal.amount_requested,
          status: getStatusObject(deal.status),
          createdAt: Math.floor(new Date(deal.created_at).getTime() / 1000),
          expiryTimestamp: Math.floor(new Date(deal.expiry_timestamp).getTime() / 1000),
          completedAt: deal.completed_at ? Math.floor(new Date(deal.completed_at).getTime() / 1000) : 0,
          escrowBump: deal.escrow_bump || 0,
        };
      });
    } catch (error) {
      console.error("Error fetching deals:", error);
      return [];
    }
  };

  const getMyDeals = async (): Promise<Deal[]> => {
    if (!wallet.publicKey) return [];
    
    try {
      // Get deals from database for fast loading
      const dbDeals = await database.getMyDeals();
      
      return dbDeals.map((deal) => {
        // Map status string to DealStatus type
        const getStatusObject = (status: string) => {
          switch (status) {
            case 'Open': return { Open: {} };
            case 'InProgress': return { InProgress: {} };
            case 'Completed': return { Completed: {} };
            case 'Cancelled': return { Cancelled: {} };
            default: return { Open: {} };
          }
        };

        return {
          dealId: deal.deal_id,
          maker: new PublicKey(deal.maker_address),
          taker: deal.taker_address ? new PublicKey(deal.taker_address) : new PublicKey("11111111111111111111111111111111"), // Use system program as null placeholder
          tokenMintOffered: new PublicKey(deal.token_mint_offered),
          amountOffered: deal.amount_offered,
          tokenMintRequested: new PublicKey(deal.token_mint_requested),
          amountRequested: deal.amount_requested,
          status: getStatusObject(deal.status),
          createdAt: Math.floor(new Date(deal.created_at).getTime() / 1000),
          expiryTimestamp: Math.floor(new Date(deal.expiry_timestamp).getTime() / 1000),
          completedAt: deal.completed_at ? Math.floor(new Date(deal.completed_at).getTime() / 1000) : 0,
          escrowBump: deal.escrow_bump || 0,
        };
      });
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
