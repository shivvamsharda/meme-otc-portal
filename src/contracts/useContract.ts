import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Transaction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, createSyncNativeInstruction } from "@solana/spl-token";
import { MEMEOTC_CONFIG } from "./config";
import { CreateDealParams, Deal } from "./types";
import { toast } from "@/hooks/use-toast";
import { useDatabase } from "@/hooks/useDatabase";
import { isAlreadyProcessedError, extractSignatureFromError } from "@/utils/dealUtils";
import { MemeotcContract } from "./memeotc_contract";
import { useState } from "react";

export const useContract = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const database = useDatabase();
  const [isLoading, setIsLoading] = useState(false);

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
      accounts: [
        { 
          name: "deal", 
          discriminator: [125, 223, 160, 234, 71, 162, 182, 219]
        },
        { 
          name: "platform", 
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
          name: "deal",
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
          name: "platform",
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

  const cleanupOrphanedDeals = async () => {
    try {
      console.log("Cleaning up orphaned deals...");
      const orphanedDeals = await database.getDeals(false);
      const dealsToCleanup = orphanedDeals.filter(deal => 
        !deal.transaction_signature || !deal.blockchain_synced
      );
      
      console.log(`Found ${dealsToCleanup.length} orphaned deals to cleanup`);
      
      for (const deal of dealsToCleanup) {
        await database.deleteDeal(deal.deal_id);
        console.log(`Cleaned up orphaned deal ${deal.deal_id}`);
      }
    } catch (error) {
      console.error("Error cleaning up orphaned deals:", error);
    }
  };

  const createDeal = async (params: CreateDealParams, setStep?: (step: string, error?: string, signature?: string) => void) => {
    if (!isAuthenticated || !wallet.publicKey) {
      throw new Error("Please connect your wallet first");
    }

    // Prevent duplicate submissions
    if (isLoading) {
      console.log("Transaction already in progress, ignoring duplicate request");
      return;
    }
    setIsLoading(true);

    console.log("Creating deal with params:", params);
    console.log("Current timestamp:", Math.floor(Date.now() / 1000));
    console.log("Expiry timestamp:", params.expiryTimestamp);

    // Add validation for expiry timestamp
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (params.expiryTimestamp <= currentTimestamp) {
      setIsLoading(false);
      toast({
        title: "Invalid Expiry Time",
        description: "Expiry time must be in the future",
        variant: "destructive",
      });
      throw new Error("Expiry time must be in the future");
    }

    // Add bounds checking (min 1 hour, max 365 days)
    const oneHour = 60 * 60;
    const oneYear = 365 * 24 * 60 * 60;
    const timeDiff = params.expiryTimestamp - currentTimestamp;
    
    if (timeDiff < oneHour) {
      setIsLoading(false);
      toast({
        title: "Expiry Too Soon",
        description: "Deal must expire at least 1 hour in the future",
        variant: "destructive",
      });
      throw new Error("Deal must expire at least 1 hour in the future");
    }
    
    if (timeDiff > oneYear) {
      setIsLoading(false);
      toast({
        title: "Expiry Too Far",
        description: "Deal cannot expire more than 1 year in the future",
        variant: "destructive",
      });
      throw new Error("Deal cannot expire more than 1 year in the future");
    }

    // Clean up any orphaned deals first
    await cleanupOrphanedDeals();

    // Check if deal already exists in database with successful blockchain transaction
    const existingDeal = await database.getDealById(params.dealId);
    if (existingDeal?.blockchain_synced && existingDeal?.transaction_signature) {
      setIsLoading(false);
      toast({
        title: "Deal Already Created",
        description: `This deal already exists with signature: ${existingDeal.transaction_signature}`,
        className: "border-blue-200 bg-blue-50 text-blue-900",
      });
      return { success: true, signature: existingDeal.transaction_signature };
    }

    let transactionSignature = null;
    
    try {
      // STEP 1: Do blockchain transaction FIRST
      console.log("Step 1: Submitting blockchain transaction...");
      
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

      // Check if maker's token account exists, create if needed
      const connection = program.provider.connection;
      const makerTokenAccountInfo = await connection.getAccountInfo(makerTokenAccount);
      
      if (!makerTokenAccountInfo) {
        console.log("Creating ATA for offered token:", params.tokenMintOffered);
        setStep?.('creating_accounts');
        
        // Create ATA in separate transaction
        const createATAInstruction = createAssociatedTokenAccountInstruction(
          wallet.publicKey, // payer
          makerTokenAccount, // ata
          wallet.publicKey, // owner
          new PublicKey(params.tokenMintOffered) // mint
        );
        
        const ataTransaction = new Transaction().add(createATAInstruction);
        const { blockhash: ataBlockhash, lastValidBlockHeight: ataLastValidBlockHeight } = 
          await connection.getLatestBlockhash('confirmed');
        ataTransaction.recentBlockhash = ataBlockhash;
        ataTransaction.feePayer = wallet.publicKey;
        
        const ataSignature = await wallet.sendTransaction(ataTransaction, connection);
        
        // Wait for ATA creation confirmation
        const ataConfirmation = await connection.confirmTransaction({
          signature: ataSignature,
          blockhash: ataBlockhash,
          lastValidBlockHeight: ataLastValidBlockHeight
        }, 'confirmed');
        
        if (ataConfirmation.value.err) {
          throw new Error(`ATA creation failed: ${ataConfirmation.value.err}`);
        }
        
        console.log("ATA created successfully:", ataSignature);
      }

      setStep?.('submitting_tx');

      // Create deal transaction separately
      transactionSignature = await program.methods
        .createDeal(
          new BN(params.dealId),
          new PublicKey(params.tokenMintOffered),
          new BN(params.amountOffered.toString()),
          new PublicKey(params.tokenMintRequested),
          new BN(params.amountRequested.toString()),
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

      console.log("Step 1 SUCCESS: Blockchain transaction completed:", transactionSignature);

      // STEP 2: Only create database entry after blockchain success
      console.log("Step 2: Creating database entry after blockchain success...");
      
      await database.createDeal({
        dealId: params.dealId,
        makerAddress: wallet.publicKey.toString(),
        tokenMintOffered: params.tokenMintOffered,
        amountOffered: params.amountOffered,
        tokenMintRequested: params.tokenMintRequested,
        amountRequested: params.amountRequested,
        expiryTimestamp: params.expiryTimestamp,
      });

      // Update database with transaction signature
      await database.updateDealWithTransaction(params.dealId, transactionSignature, true);
      
      console.log("Step 2 SUCCESS: Database entry created");

      toast({
        title: "Deal Created Successfully!",
        description: `Transaction: ${transactionSignature}`,
        className: "border-green-200 bg-green-50 text-green-900",
      });

      setIsLoading(false);
      return { success: true, signature: transactionSignature };

    } catch (error) {
      console.error("Error in deal creation:", error);
      setIsLoading(false);
      
      let errorMessage = "Unknown error occurred";
      let foundSignature = null;

      // Handle "already processed" errors as SUCCESS
      if (isAlreadyProcessedError(error)) {
        console.log("Transaction already processed - treating as success");
        foundSignature = extractSignatureFromError(error);
        
        // For "already processed", create database entry since blockchain succeeded
        try {
          console.log("Creating database entry for already processed transaction...");
          await database.createDeal({
            dealId: params.dealId,
            makerAddress: wallet.publicKey.toString(),
            tokenMintOffered: params.tokenMintOffered,
            amountOffered: params.amountOffered,
            tokenMintRequested: params.tokenMintRequested,
            amountRequested: params.amountRequested,
            expiryTimestamp: params.expiryTimestamp,
          });
          
          if (foundSignature) {
            await database.updateDealWithTransaction(params.dealId, foundSignature, true);
          } else {
            await database.updateDealStatus(params.dealId, 'Open', {
              blockchain_synced: true
            });
          }
          
          console.log("Database entry created for already processed transaction");
        } catch (dbError) {
          console.error("Error creating database entry for processed transaction:", dbError);
        }
        
        toast({
          title: "Deal Created Successfully!",
          description: foundSignature ? `Transaction: ${foundSignature}` : "Your deal was processed successfully",
          className: "border-green-200 bg-green-50 text-green-900",
        });
        
        return { success: true, signature: foundSignature };
      } else {
        // For real blockchain failures, don't create database entry at all
        errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        
        // Handle specific program errors
        if (errorMessage.includes("custom program error: 0x1")) {
          errorMessage = "Invalid expiry timestamp. Please check that your expiry time is valid and in the future.";
        }
        
        console.error("Real blockchain transaction failure:", errorMessage);
        
        toast({
          title: "Failed to Create Deal",
          description: errorMessage,
          variant: "destructive",
        });
        throw error;
      }
    }
  };

  const acceptDeal = async (dealId: number, setStep?: (step: string, error?: string, signature?: string) => void) => {
    if (!isAuthenticated || !wallet.publicKey) {
      throw new Error("Please connect your wallet first");
    }

    // Validate wallet public key before proceeding
    console.log("Validating wallet connection...");
    console.log("Wallet public key:", wallet.publicKey.toString());

    // Validate wallet public key is on curve
    try {
      if (!PublicKey.isOnCurve(wallet.publicKey.toBytes())) {
        console.error("Wallet public key is not on curve:", wallet.publicKey.toString());
        throw new Error("Wallet public key is not on curve - please reconnect your wallet");
      }
    } catch (error) {
      console.error("Error validating wallet public key:", error);
      throw new Error("Invalid wallet public key - please reconnect your wallet");
    }

    console.log("Wallet public key validation passed");

    // Log the transaction attempt
    await database.logTransaction({
      dealId,
      transactionType: 'accept',
      userAddress: wallet.publicKey.toString(),
      status: 'pending'
    });

    try {
      setStep?.('validating');
      const program = getProgram();
      
      // First, get the deal account to access its data
      const [dealPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("deal"), new BN(dealId).toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      const dealAccount = await program.account.deal.fetch(dealPda);
      
      console.log("Deal account data:", {
        dealId,
        tokenMintOffered: dealAccount.tokenMintOffered.toString(),
        tokenMintRequested: dealAccount.tokenMintRequested.toString(),
        maker: dealAccount.maker.toString()
      });

      // Validate token mint addresses before using them
      let tokenMintOffered, tokenMintRequested;
      
      try {
        // Check if they are already PublicKey objects or need conversion
        if (dealAccount.tokenMintOffered instanceof PublicKey) {
          tokenMintOffered = dealAccount.tokenMintOffered;
        } else {
          tokenMintOffered = new PublicKey(dealAccount.tokenMintOffered);
        }
        
        if (dealAccount.tokenMintRequested instanceof PublicKey) {
          tokenMintRequested = dealAccount.tokenMintRequested;
        } else {
          tokenMintRequested = new PublicKey(dealAccount.tokenMintRequested);
        }
      } catch (error) {
        console.error("Error creating PublicKey from token mints:", error);
        throw new Error("Invalid token mint address format in deal");
      }

      // Validate they are valid PublicKeys on curve
      try {
        if (!PublicKey.isOnCurve(tokenMintOffered.toBytes())) {
          console.error("Token mint offered is not on curve:", tokenMintOffered.toString());
          throw new Error("Token mint offered is not on curve - invalid address");
        }
        if (!PublicKey.isOnCurve(tokenMintRequested.toBytes())) {
          console.error("Token mint requested is not on curve:", tokenMintRequested.toString());
          throw new Error("Token mint requested is not on curve - invalid address");
        }
      } catch (error) {
        console.error("Error validating token mints:", error);
        throw new Error("Invalid token mint addresses - unable to validate curve");
      }

      console.log("Token mints validated successfully:", {
        offered: tokenMintOffered.toString(),
        requested: tokenMintRequested.toString()
      });

      // Derive PDAs with proper logging
      console.log("Deriving PDAs for constraint verification...");
      
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

      console.log("Using PDAs:", {
        deal: dealPda.toString(),
        escrow: escrowPda.toString(),
        escrowAuthority: escrowAuthority.toString(),
        platform: platformPda.toString()
      });

      // Getting associated token addresses with CORRECTED derivation
      console.log("Getting associated token addresses with CORRECTED derivation...");

      // Manual ATA derivation with correct mint assignments
      const [takerTokenAccountRequested] = PublicKey.findProgramAddressSync(
        [
          wallet.publicKey.toBuffer(),
          TOKEN_PROGRAM_ID.toBuffer(),
          tokenMintRequested.toBuffer(), // What taker pays (SOL/USDC/USDT)
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const [takerTokenAccountOffered] = PublicKey.findProgramAddressSync(
        [
          wallet.publicKey.toBuffer(),
          TOKEN_PROGRAM_ID.toBuffer(),
          tokenMintOffered.toBuffer(), // What taker receives (memecoin)
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // Manual ATA derivation for maker (receives requested token)
      const [makerTokenAccountRequested] = PublicKey.findProgramAddressSync(
        [
          dealAccount.maker.toBuffer(),
          TOKEN_PROGRAM_ID.toBuffer(),
          tokenMintRequested.toBuffer(),
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // FIXED: Platform fee account using tokenMintRequested (what the taker pays with)
      const [platformFeeAccount] = PublicKey.findProgramAddressSync(
        [
          platformPda.toBuffer(),
          TOKEN_PROGRAM_ID.toBuffer(),
          tokenMintRequested.toBuffer(), // FIXED: Use requested token (SOL/USDC/USDT) for platform fee
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      console.log("=== PLATFORM FEE ACCOUNT DERIVATION FIXED ===");
      console.log("Platform PDA used for derivation:", platformPda.toString());
      console.log("Token mint for platform fee (FIXED):", tokenMintRequested.toString());
      console.log("Derived platform fee account:", platformFeeAccount.toString());
      console.log("Platform collects fees in:", tokenMintRequested.toString(), "(what taker pays)");

      console.log("CORRECTED account assignment:", {
        takerTokenAccountRequested: takerTokenAccountRequested.toString(), // What taker pays (SOL)
        takerTokenAccountOffered: takerTokenAccountOffered.toString(), // What taker receives (memecoin)
        makerTokenAccountRequested: makerTokenAccountRequested.toString(),
        platformFeeAccount: platformFeeAccount.toString(),
        requestedMint: tokenMintRequested.toString(), // Should be SOL for this deal
        offeredMint: tokenMintOffered.toString() // Should be memecoin for this deal
      });

      // Check if token accounts exist and create them if needed
      setStep?.('creating_accounts');
      console.log("Checking if ALL required token accounts exist including platform fee...");
      const preInstructions = [];

      // Check taker's requested token account (what they're providing/paying with)
      const requestedAccountInfo = await connection.getAccountInfo(takerTokenAccountRequested);
      if (!requestedAccountInfo) {
        console.log("Creating taker's requested token account...");
        const createRequestedATA = createAssociatedTokenAccountInstruction(
          wallet.publicKey, // payer
          takerTokenAccountRequested, // ata address
          wallet.publicKey, // owner
          tokenMintRequested, // mint that taker is providing (requested token)
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );
        preInstructions.push(createRequestedATA);
      } else {
        console.log("Taker's requested token account exists");
      }

      // Check taker's offered token account (what they're receiving)
      const offeredAccountInfo = await connection.getAccountInfo(takerTokenAccountOffered);
      if (!offeredAccountInfo) {
        console.log("Creating taker's offered token account...");
        const createOfferedATA = createAssociatedTokenAccountInstruction(
          wallet.publicKey, // payer
          takerTokenAccountOffered, // ata address
          wallet.publicKey, // owner
          tokenMintOffered, // mint that taker is receiving (offered token)
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );
        preInstructions.push(createOfferedATA);
      } else {
        console.log("Taker's offered token account exists");
      }

      // Check maker's token account for the requested token (what maker receives)
      const makerRequestedAccountInfo = await connection.getAccountInfo(makerTokenAccountRequested);
      if (!makerRequestedAccountInfo) {
        console.log("Creating MAKER'S requested token account...");
        const createMakerRequestedATA = createAssociatedTokenAccountInstruction(
          wallet.publicKey, // taker pays for maker's account creation
          makerTokenAccountRequested, // ata address
          dealAccount.maker, // maker owns
          tokenMintRequested, // mint (SOL/USDC/USDT that maker wants to receive)
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );
        preInstructions.push(createMakerRequestedATA);
      } else {
        console.log("Maker's requested token account already exists");
      }

      // FIXED: Check platform fee account using CORRECT token mint (requested token)
      const platformFeeAccountInfo = await connection.getAccountInfo(platformFeeAccount);
      if (!platformFeeAccountInfo) {
        console.log("Creating platform fee account with CORRECT token mint (requested token)...");
        const createPlatformFeeATA = createAssociatedTokenAccountInstruction(
          wallet.publicKey, // taker pays
          platformFeeAccount, // platform fee account address
          platformPda, // platform owns the fee account
          tokenMintRequested, // FIXED: Platform collects fees in the requested token (SOL/USDC/USDT)
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );
        preInstructions.push(createPlatformFeeATA);
        console.log("Platform fee account creation instruction - Owner PDA:", platformPda.toString());
        console.log("Platform fee account creation instruction - Token mint:", tokenMintRequested.toString());
      } else {
        console.log("Platform fee account already exists");
      }

      // Create all needed token accounts with fresh blockhash
      if (preInstructions.length > 0) {
        console.log(`Creating ${preInstructions.length} token accounts with fresh blockhash...`);
        
        // Get fresh blockhash for this transaction
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
        
        const setupTx = new Transaction().add(...preInstructions);
        setupTx.recentBlockhash = blockhash;
        setupTx.feePayer = wallet.publicKey;
        
        const setupSig = await wallet.sendTransaction(setupTx, connection);
        
        // Wait for confirmation with timeout
        const confirmation = await connection.confirmTransaction({
          signature: setupSig,
          blockhash,
          lastValidBlockHeight
        }, 'confirmed');
        
        if (confirmation.value.err) {
          throw new Error(`Account creation failed: ${confirmation.value.err}`);
        }
        
        console.log("ALL token accounts created successfully:", setupSig);
        
        // Verify accounts were created
        console.log("Verifying account creation...");
        for (let i = 0; i < 3; i++) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check all required accounts exist
          const allAccountsExist = await Promise.all([
            connection.getAccountInfo(takerTokenAccountRequested),
            connection.getAccountInfo(takerTokenAccountOffered),
            connection.getAccountInfo(makerTokenAccountRequested),
            connection.getAccountInfo(platformFeeAccount)
          ]);
          
          if (allAccountsExist.every(account => account !== null)) {
            console.log("All accounts verified successfully");
            break;
          }
          
          if (i === 2) {
            throw new Error("Account creation verification failed after retries");
          }
        }
      } else {
        console.log("All required token accounts already exist");
      }

      // Check if the requested token is wrapped SOL and handle wrapping
      const WSOL_MINT = 'So11111111111111111111111111111111111111112';
      const isWrappedSOL = tokenMintRequested.toString() === WSOL_MINT;
      
      if (isWrappedSOL) {
        setStep?.('wrapping_sol');
        console.log("Deal requires wrapped SOL payment. Checking SOL balance...");
        
        // Get user's SOL balance
        const solBalance = await connection.getBalance(wallet.publicKey);
        console.log("User SOL balance:", solBalance / 1e9, "SOL");
        
        // Get the amount needed (from deal)
        const amountNeeded = dealAccount.amountRequested.toNumber();
        console.log("Amount needed:", amountNeeded / 1e9, "SOL");
        
        if (solBalance < amountNeeded + 10000000) { // +0.01 SOL for fees
          throw new Error(`Insufficient SOL. Need ${amountNeeded / 1e9} SOL + fees`);
        }
        
        console.log("Wrapping SOL for payment with fresh blockhash...");
        
        // Get fresh blockhash for wrapping transaction
        const { blockhash: wrapBlockhash, lastValidBlockHeight: wrapLastValid } = await connection.getLatestBlockhash('confirmed');
        
        const wrapInstructions = [];
        
        // Transfer SOL to the wrapped SOL account
        wrapInstructions.push(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: takerTokenAccountRequested,
            lamports: amountNeeded,
          })
        );
        
        // Sync native instruction to wrap the SOL
        wrapInstructions.push(
          createSyncNativeInstruction(takerTokenAccountRequested)
        );
        
        // Execute wrapping transaction with fresh blockhash
        const wrapTx = new Transaction().add(...wrapInstructions);
        wrapTx.recentBlockhash = wrapBlockhash;
        wrapTx.feePayer = wallet.publicKey;
        
        const wrapSig = await wallet.sendTransaction(wrapTx, connection);
        
        // Wait for wrap confirmation
        const wrapConfirmation = await connection.confirmTransaction({
          signature: wrapSig,
          blockhash: wrapBlockhash,
          lastValidBlockHeight: wrapLastValid
        }, 'confirmed');
        
        if (wrapConfirmation.value.err) {
          throw new Error(`SOL wrapping failed: ${wrapConfirmation.value.err}`);
        }
        
        console.log("SOL wrapped successfully:", wrapSig);
        
        // Verify wrapped SOL balance
        let attempts = 0;
        while (attempts < 5) {
          try {
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempts + 1)));
            
            const tokenAccountBalance = await connection.getTokenAccountBalance(takerTokenAccountRequested);
            console.log("Wrapped SOL balance:", tokenAccountBalance.value.uiAmount, "SOL");
            
            const requiredAmount = dealAccount.amountRequested.toString();
            const actualBalance = tokenAccountBalance.value.amount;
            
            if (BigInt(actualBalance) >= BigInt(requiredAmount)) {
              console.log("✓ Wrapped SOL balance verification passed");
              break;
            }
            
            attempts++;
            if (attempts === 5) {
              throw new Error(`Insufficient wrapped SOL balance after wrapping. Need: ${requiredAmount}, Have: ${actualBalance}`);
            }
          } catch (balanceError) {
            attempts++;
            if (attempts === 5) {
              console.error("Error checking wrapped SOL balance:", balanceError);
              throw new Error(`Failed to verify wrapped SOL balance: ${balanceError.message}`);
            }
          }
        }
      }

      // Now proceed with accept deal transaction using fresh blockhash
      setStep?.('submitting_tx');
      console.log("Executing accept deal with FIXED platform fee account constraints and fresh blockhash...");

      // Get fresh blockhash for the main transaction
      const { blockhash: dealBlockhash, lastValidBlockHeight: dealLastValid } = await connection.getLatestBlockhash('confirmed');

      // Build the accept deal instruction
      const acceptDealIx = await program.methods
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
        .instruction();

      // Create transaction with fresh blockhash
      const dealTx = new Transaction().add(acceptDealIx);
      dealTx.recentBlockhash = dealBlockhash;
      dealTx.feePayer = wallet.publicKey;

      // Send and confirm transaction
      const tx = await wallet.sendTransaction(dealTx, connection);
      
      setStep?.('confirming');
      console.log("Transaction submitted, waiting for confirmation:", tx);

      // Wait for transaction confirmation with timeout
      const confirmation = await connection.confirmTransaction({
        signature: tx,
        blockhash: dealBlockhash,
        lastValidBlockHeight: dealLastValid
      }, 'confirmed');

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      console.log("Transaction confirmed successfully:", tx);

      // Update database with successful transaction
      setStep?.('updating_db');
      await database.updateDealStatus(dealId, 'Completed', {
        taker_address: wallet.publicKey.toString(),
        completed_at: new Date().toISOString(),
        transaction_signature: tx,
        blockchain_synced: true
      });
      await database.updateTransactionStatus(dealId, 'accept', 'confirmed', tx);

      console.log("Deal accepted successfully:", tx);

      return { success: true, signature: tx };
    } catch (error) {
      console.error("Error accepting deal:", error);
      
      let errorMessage = "Unknown error occurred";
      
      // Handle "already processed" errors as SUCCESS
      if (isAlreadyProcessedError(error)) {
        console.log("Transaction already processed - treating as success");
        const foundSignature = extractSignatureFromError(error);
        
        // Update database as successful
        await database.updateDealStatus(dealId, 'Completed', {
          taker_address: wallet.publicKey.toString(),
          completed_at: new Date().toISOString(),
          transaction_signature: foundSignature,
          blockchain_synced: true
        });
        await database.updateTransactionStatus(dealId, 'accept', 'confirmed', foundSignature);
        
        return { success: true, signature: foundSignature };
      } else if (error instanceof Error) {
        if (error.message.includes("TokenOwnerOffCurveError") || error.message.includes("off curve")) {
          errorMessage = "Token derivation failed - please try again or contact support";
        } else if (error.message.includes("Invalid token mint")) {
          errorMessage = "Deal contains invalid token addresses";
        } else if (error.message.includes("Unable to validate curve")) {
          errorMessage = "Token validation failed - deal may contain corrupted data";
        } else if (error.message.includes("Wallet public key is not on curve")) {
          errorMessage = "Wallet connection issue - please reconnect your wallet";
        } else if (error.message.includes("AccountNotInitialized")) {
          errorMessage = "Token account creation failed - please try again";
        } else {
          errorMessage = error.message;
        }
      }
      
      // Update database with failed transaction
      await database.updateTransactionStatus(
        dealId, 
        'accept', 
        'failed', 
        undefined, 
        errorMessage
      );
      
      throw new Error(errorMessage);
    }
  };

  const cancelDeal = async (dealId: number) => {
    if (!isAuthenticated || !wallet.publicKey) {
      throw new Error("Please connect your wallet first");
    }

    // Prevent duplicate submissions
    if (isLoading) return;
    setIsLoading(true);

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
      
      // Get the deal account first
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
      console.log("Cancel deal error:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      // Check if this is actually a success (already processed)
      if (errorMessage.includes("already been processed") || errorMessage.includes("already processed")) {
        console.log("Transaction was already processed successfully");
        
        // Update database as successful
        await database.updateDealStatus(dealId, 'Cancelled', {
          blockchain_synced: true
        });
        await database.updateTransactionStatus(dealId, 'cancel', 'confirmed');
        
        toast({
          title: "Deal Cancelled Successfully!",
          description: "Your deal has been cancelled.",
          className: "border-green-200 bg-green-50 text-green-900",
        });
        
        return { success: true, signature: null };
      }
      
      // This is an actual error
      console.error("Actual error cancelling deal:", error);
      
      // Update database with failed transaction
      await database.updateTransactionStatus(
        dealId, 
        'cancel', 
        'failed', 
        undefined, 
        errorMessage
      );
      
      toast({
        title: "Failed to Cancel Deal",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
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
    isLoading,
    cleanupOrphanedDeals,
  };
};
