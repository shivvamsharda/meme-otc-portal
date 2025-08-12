import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, BN, Idl } from "@coral-xyz/anchor";
import { 
  PublicKey, 
  SystemProgram, 
  Transaction,
  SYSVAR_RENT_PUBKEY 
} from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  getAssociatedTokenAddress,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction
} from "@solana/spl-token";
import { PLATFORM_WALLET, MEMEOTC_CONFIG } from "./config";
import { CreateListingParams, Listing, Deal } from "./types";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { useDatabase } from "@/hooks/useDatabase";
import { supabase } from "@/integrations/supabase/client";

// SOL mint address (native SOL)
const SOL_MINT = "So11111111111111111111111111111111111111112";

// Import the IDL directly
import IDL from "./memeotc_contract.json";

export const useContract = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [isLoading, setIsLoading] = useState(false);
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

    // Use explicit program ID instead of IDL address
    const program = new Program(IDL as Idl, provider);
    
    console.log("Program created successfully:", program.programId.toString());
    console.log("Program account methods:", Object.keys(program.account || {}));
    
    return program;
  };

  // Read-only program for fetching public data without wallet connection
  const getReadOnlyProgram = () => {
    const provider = new AnchorProvider(
      connection,
      {} as any, // Empty wallet object for read-only operations
      { commitment: "confirmed" }
    );

    const program = new Program(IDL as Idl, provider);
    console.log("Read-only program created successfully:", program.programId.toString());
    
    return program;
  };

  // Helper function to generate listing PDA address from listing data
  const generateListingPDA = (seller: PublicKey, tokenMint: PublicKey, listingNonce: number): string => {
    try {
      const program = getProgram();
      const [listing] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("listing"),
          seller.toBuffer(),
          tokenMint.toBuffer(),
          new BN(listingNonce).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );
      return listing.toString();
    } catch {
      return `${seller.toString()}-${tokenMint.toString()}-${listingNonce}`;
    }
  };

  // Helper function to derive deal status from listing data
  const getDealStatus = (listing: Listing): Record<string, unknown> => {
    const now = Date.now() / 1000;
    
    if (!listing.isActive) {
      return { Open: false, Cancelled: true };
    }
    
    if (listing.expiresAt <= now) {
      return { Open: false, Expired: true };
    }
    
    return { Open: true };
  };

  // Adapter function to map Listing to Deal
  const mapListingToDeal = (listing: Listing): Deal => {
    const anyListing = listing as any;
    const dealId = generateListingPDA(listing.seller, listing.tokenMint, listing.listingNonce);

    // Prefer raw string amounts when available to avoid JS number overflow
    const tokenAmountRaw: string | undefined = anyListing.tokenAmountRaw;
    const totalPriceRaw: string | undefined = anyListing.totalPriceRaw;

    return {
      ...listing,
      dealId,
      maker: listing.seller,
      status: getDealStatus(listing),
      expiryTimestamp: listing.expiresAt,
      amountOffered: listing.tokenAmount,
      // Expose raw fields for UIs that can handle big integers safely
      ...(tokenAmountRaw ? { amountOfferedRaw: tokenAmountRaw } : {}),
      tokenMintOffered: listing.tokenMint,
      amountRequested: listing.totalPrice,
      ...(totalPriceRaw ? { amountRequestedRaw: totalPriceRaw } : {}),
      tokenMintRequested: new PublicKey(SOL_MINT),
      completedAt: null,
    } as any;
  };

  // Adapter function to map array of Listings to Deals
  const mapListingsToDeals = (listings: Listing[]): Deal[] => {
    return listings.map(mapListingToDeal);
  };

  const createListing = async (params: CreateListingParams) => {
    if (!isAuthenticated || !wallet.publicKey) {
      throw new Error("Please connect your wallet first");
    }

    if (isLoading) {
      console.log("Transaction already in progress");
      return;
    }
    setIsLoading(true);

    try {
      const program = getProgram();
      
      // Generate unique nonce if not provided
      const listingNonce = params.listingNonce || Date.now();
      
      // Generate listing PDA
      const [listing] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("listing"),
          wallet.publicKey.toBuffer(),
          new PublicKey(params.tokenMint).toBuffer(),
          new BN(listingNonce).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      // Generate escrow token account PDA
      const [escrowTokenAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), listing.toBuffer()],
        program.programId
      );

      // Get seller's token account
      const sellerTokenAccount = await getAssociatedTokenAddress(
        new PublicKey(params.tokenMint),
        wallet.publicKey
      );

      console.log("Creating listing with params:", {
        tokenAmount: params.tokenAmount,
        totalPrice: params.totalPrice,
        durationHours: params.durationHours,
        listingNonce,
        listing: listing.toString(),
        escrow: escrowTokenAccount.toString()
      });

      const tx = await program.methods
        .createListing(
          new BN(params.tokenAmount),
          new BN(params.totalPrice),
          new BN(params.durationHours),
          new BN(listingNonce)
        )
        .accounts({
          listing,
          seller: wallet.publicKey,
          tokenMint: new PublicKey(params.tokenMint),
          sellerTokenAccount,
          escrowTokenAccount,
          platformWallet: new PublicKey(PLATFORM_WALLET),
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      // Confirm the transaction and verify the listing account exists before success
      console.log("Confirming transaction:", tx);
      await connection.confirmTransaction(tx, "confirmed");

      let found = false;
      for (let i = 0; i < 10; i++) {
        const info = await connection.getAccountInfo(listing);
        if (info) {
          found = true;
          break;
        }
        await new Promise((r) => setTimeout(r, 500));
      }

      if (!found) {
        throw new Error("Listing account not found after confirmation. Please try again.");
      }

      // Store in database after successful blockchain transaction
      try {
        await database.createDeal({
          dealId: listingNonce,
          makerAddress: wallet.publicKey.toString(),
          tokenMintOffered: params.tokenMint,
          amountOffered: parseInt(params.tokenAmount),
          amountOfferedDisplay: params.amountOfferedDisplay || parseInt(params.tokenAmount) / 1e9,
          tokenOfferedName: params.tokenOfferedName,
          tokenOfferedSymbol: params.tokenOfferedSymbol,
          tokenOfferedImage: params.tokenOfferedImage,
          tokenMintRequested: "So11111111111111111111111111111111111111112", // SOL mint
          amountRequested: parseInt(params.totalPrice),
          amountRequestedDisplay: params.amountRequestedDisplay || parseInt(params.totalPrice) / 1e9,
          tokenRequestedName: params.tokenRequestedName,
          tokenRequestedSymbol: params.tokenRequestedSymbol,
          tokenRequestedImage: params.tokenRequestedImage,
          expiryTimestamp: Math.floor(Date.now() / 1000) + (params.durationHours * 3600),
          platformFee: 0
        });

        await database.logTransaction({
          dealId: listingNonce,
          transactionType: 'create',
          userAddress: wallet.publicKey.toString(),
          transactionSignature: tx,
          status: 'confirmed'
        });

        console.log("Deal stored in database successfully");
      } catch (dbError) {
        console.error("Failed to store deal in database:", dbError);
        // Don't throw - blockchain transaction succeeded
      }

      toast({
        title: "Listing Created Successfully!",
        description: `Transaction: ${tx}`,
        className: "border-green-200 bg-green-50 text-green-900",
      });

      setIsLoading(false);
      return { success: true, signature: tx, listingId: listing.toString() };

    } catch (error) {
      console.error("Error creating listing:", error);
      setIsLoading(false);
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      toast({
        title: "Failed to Create Listing",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const buyListing = async (listingId: string) => {
    if (!isAuthenticated || !wallet.publicKey) {
      throw new Error("Please connect your wallet first");
    }

     if (isLoading) return;
     setIsLoading(true);
 
     let dealIdForDb: number | null = null;
 
     try {
       const program = getProgram();
       const listing = new PublicKey(listingId);
      
      console.log("Fetching listing account:", listing.toString());
      
      // Fetch listing data
      const listingAccount = await (program.account as any).listing.fetch(listing);

      // Handle both snake_case and camelCase field names returned by Anchor
      const sellerPk: PublicKey | undefined = (listingAccount as any)?.seller;
      const tokenMintPk: PublicKey | undefined = (listingAccount as any)?.token_mint || (listingAccount as any)?.tokenMint;
      const tokenAmountVal: any = (listingAccount as any)?.token_amount ?? (listingAccount as any)?.tokenAmount;
      const totalPriceVal: any = (listingAccount as any)?.total_price ?? (listingAccount as any)?.totalPrice;
      const isActiveVal: any = (listingAccount as any)?.is_active ?? (listingAccount as any)?.isActive;
      const listingNonceVal: any = (listingAccount as any)?.listing_nonce ?? (listingAccount as any)?.listingNonce;

      console.log("Listing account data (raw):", listingAccount);
      console.log("Listing account parsed:", {
        seller: sellerPk ? sellerPk.toString() : "undefined",
        tokenMint: tokenMintPk ? tokenMintPk.toString() : "undefined",
        tokenAmount: tokenAmountVal?.toString?.() ?? String(tokenAmountVal),
        totalPrice: totalPriceVal?.toString?.() ?? String(totalPriceVal),
        isActive: isActiveVal,
        listingNonce: listingNonceVal?.toString?.() ?? String(listingNonceVal)
      });

      if (!sellerPk || !tokenMintPk) {
        throw new Error("Malformed listing account: missing seller or token mint");
      }

      // Resolve DB deal id from listing nonce and log pending tx
      try {
        dealIdForDb = typeof listingNonceVal?.toNumber === 'function'
          ? listingNonceVal.toNumber()
          : Number(listingNonceVal?.toString?.() ?? listingNonceVal);
      } catch {
        dealIdForDb = Number(listingNonceVal as any);
      }

      try {
        if (typeof dealIdForDb === 'number' && !Number.isNaN(dealIdForDb)) {
          await database.logTransaction({
            dealId: dealIdForDb,
            transactionType: 'accept',
            userAddress: wallet.publicKey.toString(),
            status: 'pending'
          });
        }
      } catch (e) {
        console.warn('Failed to log pending accept transaction:', e);
      }

      // Generate escrow token account PDA
      const [escrowTokenAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), listing.toBuffer()],
        program.programId
      );

      // Get buyer's token account (will be created automatically)
      const buyerTokenAccount = await getAssociatedTokenAddress(
        tokenMintPk,
        wallet.publicKey
      );

      // Ensure buyer ATA exists prior to CPI in program
      const ataInfo = await connection.getAccountInfo(buyerTokenAccount);
      const preInstructions: any[] = [];
      if (!ataInfo) {
        console.log("Buyer ATA missing, creating:", buyerTokenAccount.toString());
        preInstructions.push(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey, // payer
            buyerTokenAccount, // ata
            wallet.publicKey, // owner
            tokenMintPk, // mint
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );
      }

      console.log("Buy listing accounts:", {
        listing: listing.toString(),
        buyer: wallet.publicKey.toString(),
        seller: sellerPk.toString(),
        buyerTokenAccount: buyerTokenAccount.toString(),
        escrowTokenAccount: escrowTokenAccount.toString(),
        platformWallet: PLATFORM_WALLET
      });

      const tx = await program.methods
        .buyListing()
        .accounts({
          listing,
          buyer: wallet.publicKey,
          seller: sellerPk,
          buyerTokenAccount,
          escrowTokenAccount,
          platformWallet: new PublicKey(PLATFORM_WALLET),
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .preInstructions(preInstructions)
        .rpc();

      // Update database directly after successful purchase
      try {
        if (typeof dealIdForDb === 'number' && !Number.isNaN(dealIdForDb)) {
          await database.updateDealStatus(dealIdForDb, 'Completed', {
            taker_address: wallet.publicKey.toString(),
            completed_at: new Date().toISOString(),
          });
          await database.updateDealWithTransaction(dealIdForDb, tx, true);
          await database.updateTransactionStatus(dealIdForDb, 'accept', 'confirmed', tx);
        }
      } catch (dbErr) {
        console.error('Failed to update DB after accept:', dbErr);
      }

      toast({
        title: "Listing Purchased Successfully!",
        description: `Transaction: ${tx}`,
        className: "border-green-200 bg-green-50 text-green-900",
      });

      setIsLoading(false);
      return { success: true, signature: tx };

    } catch (error) {
      console.error("Error buying listing:", error);
      setIsLoading(false);
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

      // Mark transaction failed in DB if we logged it
      try {
        if (typeof dealIdForDb === 'number' && !Number.isNaN(dealIdForDb)) {
          await database.updateTransactionStatus(dealIdForDb, 'accept', 'failed', undefined, errorMessage);
        }
      } catch (e2) {
        console.warn('Failed to update transaction status to failed:', e2);
      }
      
      toast({
        title: "Failed to Buy Listing",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const cancelListing = async (listingId: string) => {
    if (!isAuthenticated || !wallet.publicKey) {
      throw new Error("Please connect your wallet first");
    }

    if (isLoading) return;
    setIsLoading(true);

    let dealIdForDb: number | null = null;
    try {
      const program = getProgram();
      const listing = new PublicKey(listingId);
      
      // Fetch listing data
      const listingAccount = await (program.account as any).listing.fetch(listing);

      // Resolve DB deal id from listing nonce and log pending tx
      const listingNonceVal: any = (listingAccount as any)?.listing_nonce ?? (listingAccount as any)?.listingNonce;
      try {
        dealIdForDb = typeof listingNonceVal?.toNumber === 'function'
          ? listingNonceVal.toNumber()
          : Number(listingNonceVal?.toString?.() ?? listingNonceVal);
      } catch {
        dealIdForDb = Number(listingNonceVal as any);
      }
      try {
        if (typeof dealIdForDb === 'number' && !Number.isNaN(dealIdForDb)) {
          await database.logTransaction({
            dealId: dealIdForDb,
            transactionType: 'cancel',
            userAddress: wallet.publicKey.toString(),
            status: 'pending'
          });
        }
      } catch (e) {
        console.warn('Failed to log pending cancel transaction:', e);
      }

      // Generate escrow token account PDA
      const [escrowTokenAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), listing.toBuffer()],
        program.programId
      );

      // Get seller's token account
      const tokenMintForSeller: PublicKey | undefined = (listingAccount as any)?.token_mint || (listingAccount as any)?.tokenMint;
      if (!tokenMintForSeller) throw new Error("Malformed listing account: missing token mint");
      const sellerTokenAccount = await getAssociatedTokenAddress(
        tokenMintForSeller,
        wallet.publicKey
      );

      // Ensure seller ATA exists prior to CPI in program
      const sellerAtaInfo = await connection.getAccountInfo(sellerTokenAccount);
      const preInstructions: any[] = [];
      if (!sellerAtaInfo) {
        console.log("Seller ATA missing, creating:", sellerTokenAccount.toString());
        preInstructions.push(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey, // payer
            sellerTokenAccount, // ata
            wallet.publicKey, // owner (seller)
            tokenMintForSeller, // mint
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );
      }

      const tx = await program.methods
        .cancelListing()
        .accounts({
          listing,
          seller: wallet.publicKey,
          sellerTokenAccount,
          escrowTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .preInstructions(preInstructions)
        .rpc();

      // Update database directly after successful cancel
      try {
        if (typeof dealIdForDb === 'number' && !Number.isNaN(dealIdForDb)) {
          await database.updateDealStatus(dealIdForDb, 'Cancelled');
          await database.updateDealWithTransaction(dealIdForDb, tx, true);
          await database.updateTransactionStatus(dealIdForDb, 'cancel', 'confirmed', tx);
        }
      } catch (dbErr) {
        console.error('Failed to update DB after cancel:', dbErr);
      }

      toast({
        title: "Listing Cancelled Successfully!",
        description: `Transaction: ${tx}`,
        className: "border-green-200 bg-green-50 text-green-900",
      });

      setIsLoading(false);
      return { success: true, signature: tx };

    } catch (error) {
      console.error("Error cancelling listing:", error);
      setIsLoading(false);
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

      // Mark transaction failed in DB if we logged it
      try {
        if (typeof dealIdForDb === 'number' && !Number.isNaN(dealIdForDb)) {
          await database.updateTransactionStatus(dealIdForDb, 'cancel', 'failed', undefined, errorMessage);
        }
      } catch (e2) {
        console.warn('Failed to update transaction status to failed (cancel):', e2);
      }
      
      toast({
        title: "Failed to Cancel Listing",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const getListings = async (): Promise<Deal[]> => {
    try {
      // Try database first (faster and includes metadata)
      console.log("Fetching deals from database...");
      const dbDeals = await database.getDeals(true); // Get only open deals
      
      if (dbDeals.length > 0) {
        console.log(`Found ${dbDeals.length} deals in database`);
        return dbDeals.map((deal) => {
          // Derive canonical listing PDA so detail routes use PDA id
          let listingPdaStr: string | null = null;
          try {
            const [listingPda] = PublicKey.findProgramAddressSync(
              [
                Buffer.from("listing"),
                new PublicKey(deal.maker_address).toBuffer(),
                new PublicKey(deal.token_mint_offered).toBuffer(),
                new BN(deal.deal_id).toArrayLike(Buffer, "le", 8),
              ],
              MEMEOTC_CONFIG.programId
            );
            listingPdaStr = listingPda.toString();
          } catch (e) {
            console.warn("Failed to derive listing PDA, falling back to nonce string", e);
            listingPdaStr = String(deal.deal_id);
          }

          const status = (() => {
            switch (deal.status) {
              case "Open":
                return { Open: true } as Record<string, unknown>;
              case "Cancelled":
                return { Cancelled: true } as Record<string, unknown>;
              case "Completed":
                return { Completed: true } as Record<string, unknown>;
              case "Expired":
                return { Expired: true } as Record<string, unknown>;
              default:
                return { Unknown: true } as Record<string, unknown>;
            }
          })();

          return {
            seller: new PublicKey(deal.maker_address),
            tokenMint: new PublicKey(deal.token_mint_offered),
            tokenAmount: deal.amount_offered,
            totalPrice: deal.amount_requested,
            createdAt: new Date(deal.created_at).getTime() / 1000,
            expiresAt: new Date(deal.expiry_timestamp).getTime() / 1000,
            isActive: deal.status === 'Open',
            listingNonce: deal.deal_id,
            bump: deal.escrow_bump || 0,
            escrowBump: deal.escrow_bump || 0,
            dealId: listingPdaStr || String(deal.deal_id),
            deal_id: deal.deal_id, // Expose numeric database ID for fallback
            maker: new PublicKey(deal.maker_address),
            status,
            expiryTimestamp: new Date(deal.expiry_timestamp).getTime() / 1000,
            amountOffered: deal.amount_offered,
            tokenMintOffered: new PublicKey(deal.token_mint_offered),
            amountRequested: deal.amount_requested,
            tokenMintRequested: new PublicKey(deal.token_mint_requested),
            completedAt: deal.completed_at ? new Date(deal.completed_at).getTime() / 1000 : null,
            amountOfferedDisplay: deal.amount_offered_display,
            amountRequestedDisplay: deal.amount_requested_display
          } as any;
        });
      }

      // Fallback to blockchain if database is empty
      console.log("No deals in database, fetching from blockchain...");
      const program = getReadOnlyProgram();
      
      // Check if program.account.listing exists
      const listingNs = (program.account as any)?.listing;
      if (!listingNs) {
        console.error("Program account.listing is undefined");
        return [];
      }
      
      const listings = await listingNs.all();
      
      console.log(`Found ${listings.length} listings`);
      
      const now = Date.now() / 1000;
      
      const mappedListings = listings
        .map(listing => {
          const raw = listing.account.is_active as any;
          const isActive = typeof raw === 'number' ? raw !== 0 : !!raw;

          const tokenAmountBn = listing.account.token_amount as BN;
          let tokenAmountNum = 0;
          try {
            tokenAmountNum = tokenAmountBn.toNumber();
          } catch (e) {
            console.warn("token_amount exceeds JS safe range; using raw string for UI", {
              listing: (listing as any).publicKey?.toString?.() || 'unknown',
            });
          }

          const totalPriceBn = listing.account.total_price as BN;
          let totalPriceNum = 0;
          try {
            totalPriceNum = totalPriceBn.toNumber();
          } catch (e) {
            console.warn("total_price exceeds JS safe range; using raw string for UI");
          }

          return {
            seller: listing.account.seller,
            tokenMint: listing.account.token_mint, // FIXED: snake_case
            tokenAmount: tokenAmountNum,
            totalPrice: totalPriceNum,
            createdAt: listing.account.created_at.toNumber(), // FIXED: snake_case
            expiresAt: listing.account.expires_at.toNumber(), // FIXED: snake_case
            isActive,
            listingNonce: listing.account.listing_nonce.toNumber(), // FIXED: snake_case
            bump: listing.account.bump,
            escrowBump: listing.account.escrow_bump, // FIXED: snake_case
            // raw strings for UIs that handle big integers
            tokenAmountRaw: tokenAmountBn.toString(),
            totalPriceRaw: totalPriceBn.toString(),
          } as any;
        })
        .filter(listing => listing.isActive && listing.expiresAt > now);
        
      return mapListingsToDeals(mappedListings);
        
    } catch (error) {
      console.error("Error fetching listings:", error);
      return [];
    }
  };

  const getMyListings = async (): Promise<Deal[]> => {
    if (!wallet.publicKey) return [];

    try {
      // Read from database for both created and accepted deals
      const dbDeals = await database.getMyDeals();

      const mapped: Deal[] = dbDeals.map((deal) => {
        // Derive the canonical listing PDA so actions like cancel work
        let listingPdaStr: string | null = null;
        try {
          const [listingPda] = PublicKey.findProgramAddressSync(
            [
              Buffer.from("listing"),
              new PublicKey(deal.maker_address).toBuffer(),
              new PublicKey(deal.token_mint_offered).toBuffer(),
              new BN(deal.deal_id).toArrayLike(Buffer, "le", 8),
            ],
            MEMEOTC_CONFIG.programId
          );
          listingPdaStr = listingPda.toString();
        } catch (e) {
          console.warn("Failed to derive listing PDA, falling back to nonce string", e);
          listingPdaStr = String(deal.deal_id);
        }

        const status = (() => {
          switch (deal.status) {
            case "Open":
              return { Open: true } as Record<string, unknown>;
            case "Cancelled":
              return { Cancelled: true } as Record<string, unknown>;
            case "Completed":
              return { Completed: true } as Record<string, unknown>;
            case "Expired":
              return { Expired: true } as Record<string, unknown>;
            default:
              return { Unknown: true } as Record<string, unknown>;
          }
        })();

        return {
          // Listing base (for compatibility with Listing/Deal unions)
          seller: new PublicKey(deal.maker_address),
          tokenMint: new PublicKey(deal.token_mint_offered),
          tokenAmount: Number(deal.amount_offered),
          totalPrice: Number(deal.amount_requested),
          createdAt: new Date(deal.created_at).getTime() / 1000,
          expiresAt: new Date(deal.expiry_timestamp).getTime() / 1000,
          isActive: deal.status === "Open",
          listingNonce: Number(deal.deal_id),
          bump: deal.escrow_bump || 0,
          escrowBump: deal.escrow_bump || 0,

          // Deal-specific
          dealId: listingPdaStr || String(deal.deal_id),
          maker: new PublicKey(deal.maker_address),
          status,
          expiryTimestamp: new Date(deal.expiry_timestamp).getTime() / 1000,
          amountOffered: Number(deal.amount_offered),
          tokenMintOffered: new PublicKey(deal.token_mint_offered),
          amountRequested: Number(deal.amount_requested),
          tokenMintRequested: new PublicKey(deal.token_mint_requested),
          completedAt: deal.completed_at ? new Date(deal.completed_at).getTime() / 1000 : null,
        } as unknown as Deal;
      });

      return mapped;
    } catch (error) {
      console.error("Error fetching my listings from DB:", error);
      return [];
    }
  };

  // Wallet-independent PDA generator for read-only operations
  const generateListingPDAReadOnly = (sellerAddress: string, tokenMintAddress: string, listingNonce: number): string | null => {
    try {
      const seller = new PublicKey(sellerAddress);
      const tokenMint = new PublicKey(tokenMintAddress);
      const [listingPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("listing"),
          seller.toBuffer(),
          tokenMint.toBuffer(),
          new BN(listingNonce).toArrayLike(Buffer, "le", 8)
        ],
        MEMEOTC_CONFIG.programId
      );
      return listingPDA.toString();
    } catch (error) {
      console.error("Error generating listing PDA:", error);
      return null;
    }
  };

  return {
    isAuthenticated,
    createListing,
    buyListing,
    cancelListing,
    getListings,
    getMyListings,
    generateListingPDAReadOnly,
    // Backward-compat aliases
    createDeal: createListing,
    acceptDeal: buyListing,
    cancelDeal: cancelListing,
    getDeals: getListings,
    getMyDeals: getMyListings,
    isLoading,
  };
};
