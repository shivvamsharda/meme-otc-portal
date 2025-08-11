import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
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
import { MEMEOTC_CONFIG, PLATFORM_WALLET } from "./config";
import { CreateListingParams, Listing, Deal } from "./types";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

// Import the IDL
import IDL from "./memeotc_contract.json";
import { MemeotcPlatform } from "./memeotc_contract";

export const useContract = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
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

    const program = new Program<MemeotcPlatform>(IDL as any, provider);
    return program;
  };

  const getReadOnlyProgram = () => {
    // Minimal wallet interface for read-only operations
    const readOnlyWallet = {
      publicKey: null,
      signTransaction: async () => { throw new Error("Read-only provider cannot sign"); },
      signAllTransactions: async () => { throw new Error("Read-only provider cannot sign"); },
    } as any;

    const provider = new AnchorProvider(
      connection,
      readOnlyWallet,
      { commitment: "confirmed" }
    );
    const program = new Program<MemeotcPlatform>(IDL as any, provider);
    return program;
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

      // Check if seller has sufficient balance
      try {
        const balance = await connection.getTokenAccountBalance(sellerTokenAccount);
        const tokenDecimals = balance.value.decimals;
        const requiredAmount = params.tokenAmount / Math.pow(10, tokenDecimals);
        
        if ((balance.value.uiAmount || 0) < requiredAmount) {
          throw new Error(`Insufficient token balance. You need ${requiredAmount} tokens.`);
        }
      } catch (error: any) {
        if (error.message.includes("could not find account")) {
          throw new Error("You don't have any balance of this token.");
        }
        throw error;
      }

      const tx = await program.methods
        .createListing(
          new BN(params.tokenAmount),
          new BN(params.pricePerToken),
          new BN(params.durationHours),
          new BN(listingNonce)
        )
        .accounts({
          listing: listing,
          seller: wallet.publicKey,
          tokenMint: new PublicKey(params.tokenMint),
          sellerTokenAccount,
          escrowTokenAccount,
          platformWallet: new PublicKey(PLATFORM_WALLET),
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        } as any)
        .rpc();

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

    try {
      const program = getProgram();
      const listing = new PublicKey(listingId);
      
      // Fetch listing data
      const listingAccount = await program.account.listing.fetch(listing);
      
      // Re-derive listing PDA for validation
      const [listingPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("listing"),
          listingAccount.seller.toBuffer(),
          listingAccount.tokenMint.toBuffer(),
          new BN(listingAccount.listingNonce.toString()).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      // Generate escrow token account PDA
      const [escrowTokenAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), listing.toBuffer()],
        program.programId
      );

      // Get buyer's token account (will be created if needed)
      const buyerTokenAccount = await getAssociatedTokenAddress(
        listingAccount.tokenMint,
        wallet.publicKey
      );

      // Check if buyer token account exists, create if needed
      const buyerTokenAccountInfo = await connection.getAccountInfo(buyerTokenAccount);
      const preInstructions = [];
      
      if (!buyerTokenAccountInfo) {
        preInstructions.push(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            buyerTokenAccount,
            wallet.publicKey,
            listingAccount.tokenMint
          )
        );
      }

      // Create transaction
      const transaction = new Transaction();
      
      // Add pre-instructions if any
      if (preInstructions.length > 0) {
        transaction.add(...preInstructions);
      }

      // Add buy instruction
      const buyInstruction = await program.methods
        .buyListing()
        .accounts({
          listing: listing, // Add the missing listing account
          buyer: wallet.publicKey,
          seller: listingAccount.seller,
          buyerTokenAccount,
          escrowTokenAccount,
          platformWallet: new PublicKey(PLATFORM_WALLET),
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        } as any)
        .instruction();

      transaction.add(buyInstruction);

      // Send transaction
      const tx = await wallet.sendTransaction(transaction, connection);
      
      // Wait for confirmation
      await connection.confirmTransaction(tx, 'confirmed');

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

    try {
      const program = getProgram();
      const listing = new PublicKey(listingId);
      
      // Fetch listing data
      const listingAccount = await program.account.listing.fetch(listing);
      
      // Re-derive listing PDA for validation
      const [listingPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("listing"),
          listingAccount.seller.toBuffer(),
          listingAccount.tokenMint.toBuffer(),
          new BN(listingAccount.listingNonce.toString()).toArrayLike(Buffer, "le", 8),
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
        listingAccount.tokenMint,
        wallet.publicKey
      );

      const tx = await program.methods
        .cancelListing()
        .accounts({
          listing: listing,
          seller: wallet.publicKey,
          sellerTokenAccount,
          escrowTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        } as any)
        .rpc();

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
      const program = getReadOnlyProgram();
      const listings = await program.account.listing.all();
      
      const now = Date.now() / 1000;
      
      return listings
        .map((listing) => ({
          ...listing.account,
          // Core listing properties
          seller: listing.account.seller,
          tokenMint: listing.account.tokenMint,
          tokenAmount: listing.account.tokenAmount.toNumber(),
          pricePerToken: listing.account.pricePerToken.toNumber(),
          totalPrice: listing.account.totalPrice.toNumber(),
          createdAt: listing.account.createdAt.toNumber(),
          expiresAt: listing.account.expiresAt.toNumber(),
          listingNonce: listing.account.listingNonce.toNumber(),
          // Backward compatibility mappings - use listing address as dealId
          dealId: listing.publicKey.toString(),
          maker: listing.account.seller,
          amountOffered: listing.account.tokenAmount.toNumber(),
          tokenMintOffered: listing.account.tokenMint,
          amountRequested: listing.account.totalPrice.toNumber(),
          tokenMintRequested: new PublicKey("So11111111111111111111111111111111111111112"), // SOL mint for price
          status: listing.account.isActive ? { Open: {} } : { Inactive: {} },
          expiryTimestamp: listing.account.expiresAt.toNumber(),
        }))
        .filter(listing => listing.isActive && listing.expiresAt > now);
        
    } catch (error) {
      console.error("Error fetching listings:", error);
      return [];
    }
  };

  const getMyListings = async (): Promise<Deal[]> => {
    if (!wallet.publicKey) return [];
    
    try {
      const program = getProgram();
      const listings = await program.account.listing.all([
        {
          memcmp: {
            offset: 8, // Skip discriminator
            bytes: wallet.publicKey.toBase58(),
          }
        }
      ]);
      
      return listings.map((listing) => ({
        ...listing.account,
        // Core listing properties
        seller: listing.account.seller,
        tokenMint: listing.account.tokenMint,
        tokenAmount: listing.account.tokenAmount.toNumber(),
        pricePerToken: listing.account.pricePerToken.toNumber(),
        totalPrice: listing.account.totalPrice.toNumber(),
        createdAt: listing.account.createdAt.toNumber(),
        expiresAt: listing.account.expiresAt.toNumber(),
        listingNonce: listing.account.listingNonce.toNumber(),
        // Backward compatibility mappings - use listing address as dealId
        dealId: listing.publicKey.toString(),
        maker: listing.account.seller,
        amountOffered: listing.account.tokenAmount.toNumber(),
        tokenMintOffered: listing.account.tokenMint,
        amountRequested: listing.account.totalPrice.toNumber(),
        tokenMintRequested: new PublicKey("So11111111111111111111111111111111111111112"), // SOL mint for price
        status: listing.account.isActive ? { Open: {} } : { Inactive: {} },
        expiryTimestamp: listing.account.expiresAt.toNumber(),
      }));
      
    } catch (error) {
      console.error("Error fetching my listings:", error);
      return [];
    }
  };

  // Backward compatibility aliases with parameter adaptation
  const getDeals = getListings;
  const acceptDeal = (dealId: string | number) => {
    // dealId is now the listing address string
    const listingId = typeof dealId === 'string' ? dealId : dealId.toString();
    return buyListing(listingId);
  };
  const createDeal = async (params: any) => {
    // Map old deal params to new listing params
    const listingParams: CreateListingParams = {
      tokenAmount: params.amountOffered || params.tokenAmount,
      pricePerToken: params.pricePerToken || Math.floor((params.amountRequested || 0) / (params.amountOffered || 1)),
      durationHours: params.durationHours || 24,
      listingNonce: params.dealId || Date.now(),
      tokenMint: params.tokenMintOffered || params.tokenMint,
    };
    return createListing(listingParams);
  };
  const cancelDeal = (dealId: string | number) => {
    // dealId is now the listing address string
    const listingId = typeof dealId === 'string' ? dealId : dealId.toString();
    return cancelListing(listingId);
  };
  const getMyDeals = getMyListings;

  return {
    isAuthenticated,
    createListing,
    buyListing,
    cancelListing,
    getListings,
    getMyListings,
    // Backward compatibility
    getDeals,
    acceptDeal,
    createDeal,
    cancelDeal,
    getMyDeals,
    isLoading,
  };
};
