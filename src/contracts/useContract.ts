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

    // Create a complete TypeScript IDL object with all required sections
    const tsIDL: MemeotcContract = {
      address: "2yT4Gd7NV9NDcetuoBZsdA317Ko3JAZDGx6RCCaTATfJ",
      metadata: {
        name: "memeotcContract",
        version: "0.1.0",
        spec: "0.1.0",
        description: "Created with Anchor"
      },
      instructions: [
        {
          name: "acceptDeal",
          docs: ["Accept and execute an OTC deal"],
          discriminator: [76, 156, 34, 30, 129, 136, 76, 244],
          accounts: [
            { name: "platform", writable: true, pda: { seeds: [{ kind: "const", value: [112, 108, 97, 116, 102, 111, 114, 109] }] } },
            { name: "deal", writable: true, pda: { seeds: [{ kind: "const", value: [100, 101, 97, 108] }, { kind: "account", path: "deal.deal_id", account: "deal" }] } },
            { name: "escrowAccount", writable: true, pda: { seeds: [{ kind: "const", value: [101, 115, 99, 114, 111, 119] }, { kind: "account", path: "deal.deal_id", account: "deal" }] } },
            { name: "escrowAuthority", pda: { seeds: [{ kind: "const", value: [101, 115, 99, 114, 111, 119] }, { kind: "account", path: "deal.deal_id", account: "deal" }] } },
            { name: "taker", writable: true, signer: true },
            { name: "takerTokenAccountRequested", writable: true },
            { name: "takerTokenAccountOffered", writable: true },
            { name: "makerTokenAccountRequested", writable: true },
            { name: "platformFeeAccount", writable: true },
            { name: "tokenProgram", address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" }
          ],
          args: []
        },
        {
          name: "cancelDeal",
          docs: ["Cancel an OTC deal"],
          discriminator: [158, 86, 193, 45, 168, 111, 48, 29],
          accounts: [
            { name: "deal", writable: true, pda: { seeds: [{ kind: "const", value: [100, 101, 97, 108] }, { kind: "account", path: "deal.deal_id", account: "deal" }] } },
            { name: "escrowAccount", writable: true, pda: { seeds: [{ kind: "const", value: [101, 115, 99, 114, 111, 119] }, { kind: "account", path: "deal.deal_id", account: "deal" }] } },
            { name: "escrowAuthority", pda: { seeds: [{ kind: "const", value: [101, 115, 99, 114, 111, 119] }, { kind: "account", path: "deal.deal_id", account: "deal" }] } },
            { name: "maker", writable: true, signer: true },
            { name: "makerTokenAccount", writable: true },
            { name: "tokenProgram", address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" }
          ],
          args: []
        },
        {
          name: "createDeal",
          docs: ["Create a new OTC deal"],
          discriminator: [198, 212, 144, 151, 97, 56, 149, 113],
          accounts: [
            { name: "platform", writable: true, pda: { seeds: [{ kind: "const", value: [112, 108, 97, 116, 102, 111, 114, 109] }] } },
            { name: "deal", writable: true, pda: { seeds: [{ kind: "const", value: [100, 101, 97, 108] }, { kind: "arg", path: "dealId" }] } },
            { name: "escrowAccount", writable: true, pda: { seeds: [{ kind: "const", value: [101, 115, 99, 114, 111, 119] }, { kind: "arg", path: "dealId" }] } },
            { name: "escrowAuthority", pda: { seeds: [{ kind: "const", value: [101, 115, 99, 114, 111, 119] }, { kind: "arg", path: "dealId" }] } },
            { name: "maker", writable: true, signer: true },
            { name: "makerTokenAccount", writable: true },
            { name: "tokenMintOffered" },
            { name: "tokenMintRequested" },
            { name: "tokenProgram", address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
            { name: "systemProgram", address: "11111111111111111111111111111111" }
          ],
          args: [
            { name: "dealId", type: "u64" },
            { name: "tokenMintOffered", type: "pubkey" },
            { name: "amountOffered", type: "u64" },
            { name: "tokenMintRequested", type: "pubkey" },
            { name: "amountRequested", type: "u64" },
            { name: "expiryTimestamp", type: "i64" }
          ]
        },
        {
          name: "initialize",
          docs: ["Initialize the MemeOTC platform"],
          discriminator: [175, 175, 109, 31, 13, 152, 155, 237],
          accounts: [
            { name: "platform", writable: true, pda: { seeds: [{ kind: "const", value: [112, 108, 97, 116, 102, 111, 114, 109] }] } },
            { name: "authority", writable: true, signer: true },
            { name: "systemProgram", address: "11111111111111111111111111111111" }
          ],
          args: []
        },
        {
          name: "setPlatformPause",
          docs: ["Pause/unpause the platform (only platform authority)"],
          discriminator: [66, 196, 80, 8, 64, 171, 56, 26],
          accounts: [
            { name: "platform", writable: true, pda: { seeds: [{ kind: "const", value: [112, 108, 97, 116, 102, 111, 114, 109] }] } },
            { name: "authority", signer: true, relations: ["platform"] }
          ],
          args: [{ name: "paused", type: "bool" }]
        },
        {
          name: "updatePlatformFee",
          docs: ["Update platform fee (only platform authority)"],
          discriminator: [162, 97, 186, 47, 93, 113, 176, 243],
          accounts: [
            { name: "platform", writable: true, pda: { seeds: [{ kind: "const", value: [112, 108, 97, 116, 102, 111, 114, 109] }] } },
            { name: "authority", signer: true, relations: ["platform"] }
          ],
          args: [{ name: "newFeeBps", type: "u16" }]
        }
      ],
      // CRITICAL: Add the missing accounts section with discriminators
      accounts: [
        { 
          name: "Deal", 
          discriminator: [125, 223, 160, 234, 71, 162, 182, 219]
        },
        { 
          name: "Platform", 
          discriminator: [77, 92, 204, 58, 187, 98, 91, 12]
        }
      ],
      events: [
        { name: "DealCancelled", discriminator: [229, 189, 86, 176, 134, 151, 43, 152] },
        { name: "DealCompleted", discriminator: [3, 185, 99, 192, 252, 161, 216, 28] },
        { name: "DealCreated", discriminator: [27, 18, 50, 52, 104, 175, 46, 101] },
        { name: "PlatformFeeUpdated", discriminator: [210, 134, 201, 4, 92, 228, 80, 26] }
      ],
      errors: [
        { code: 6000, name: "InvalidAmount", msg: "Invalid amount provided" },
        { code: 6001, name: "InvalidExpiry", msg: "Invalid expiry timestamp" },
        { code: 6002, name: "DealNotOpen", msg: "Deal is not open for acceptance" },
        { code: 6003, name: "DealExpired", msg: "Deal has expired" },
        { code: 6004, name: "DealAlreadyTaken", msg: "Deal has already been taken" },
        { code: 6005, name: "Unauthorized", msg: "Unauthorized action" },
        { code: 6006, name: "FeeTooHigh", msg: "Platform fee is too high" },
        { code: 6007, name: "CannotAcceptOwnDeal", msg: "Cannot accept your own deal" },
        { code: 6008, name: "SameTokenMints", msg: "Offered and requested token mints cannot be the same" },
        { code: 6009, name: "PlatformPaused", msg: "Platform is currently paused" }
      ],
      types: [
        {
          name: "Deal",
          type: {
            kind: "struct",
            fields: [
              { name: "dealId", type: "u64" },
              { name: "maker", type: "pubkey" },
              { name: "taker", type: "pubkey" },
              { name: "tokenMintOffered", type: "pubkey" },
              { name: "amountOffered", type: "u64" },
              { name: "tokenMintRequested", type: "pubkey" },
              { name: "amountRequested", type: "u64" },
              { name: "status", type: { defined: { name: "DealStatus" } } },
              { name: "createdAt", type: "i64" },
              { name: "expiryTimestamp", type: "i64" },
              { name: "completedAt", type: "i64" },
              { name: "escrowBump", type: "u8" }
            ]
          }
        },
        {
          name: "DealCancelled",
          type: {
            kind: "struct",
            fields: [
              { name: "dealId", type: "u64" },
              { name: "maker", type: "pubkey" }
            ]
          }
        },
        {
          name: "DealCompleted",
          type: {
            kind: "struct",
            fields: [
              { name: "dealId", type: "u64" },
              { name: "maker", type: "pubkey" },
              { name: "taker", type: "pubkey" },
              { name: "amountOffered", type: "u64" },
              { name: "amountRequested", type: "u64" },
              { name: "platformFee", type: "u64" }
            ]
          }
        },
        {
          name: "DealCreated",
          type: {
            kind: "struct",
            fields: [
              { name: "dealId", type: "u64" },
              { name: "maker", type: "pubkey" },
              { name: "tokenOffered", type: "pubkey" },
              { name: "amountOffered", type: "u64" },
              { name: "tokenRequested", type: "pubkey" },
              { name: "amountRequested", type: "u64" },
              { name: "expiry", type: "i64" }
            ]
          }
        },
        {
          name: "DealStatus",
          type: {
            kind: "enum",
            variants: [
              { name: "Open" },
              { name: "InProgress" },
              { name: "Completed" },
              { name: "Cancelled" }
            ]
          }
        },
        {
          name: "Platform",
          type: {
            kind: "struct",
            fields: [
              { name: "authority", type: "pubkey" },
              { name: "totalDeals", type: "u64" },
              { name: "completedDeals", type: "u64" },
              { name: "platformFeeBps", type: "u16" },
              { name: "isPaused", type: "bool" }
            ]
          }
        },
        {
          name: "PlatformFeeUpdated",
          type: {
            kind: "struct",
            fields: [
              { name: "oldFee", type: "u16" },
              { name: "newFee", type: "u16" }
            ]
          }
        }
      ]
    };

    // Use the complete TypeScript IDL directly
    const program = new Program<MemeotcContract>(
      tsIDL,
      provider
    );

    // Debug logging to verify program structure
    console.log("Program methods available:", Object.keys(program.methods));
    console.log("Program account available:", !!program.account);
    console.log("Program account deal available:", !!program.account.deal);

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
      
      // First, get the deal account to access its data - FIXED: use lowercase 'deal'
      const [dealPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("deal"), new BN(dealId).toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      const dealAccount = await program.account.deal.fetch(dealPda);
      
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
      console.log("Cancel deal - program.account available:", !!program.account);
      console.log("Cancel deal - program.account.deal available:", !!program.account.deal);
      
      // Get the deal account first - FIXED: use lowercase 'deal'
      const [dealPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("deal"), new BN(dealId).toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      const dealAccount = await program.account.deal.fetch(dealPda);

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
