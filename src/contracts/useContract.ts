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
import { MEMEOTC_CONFIG, PLATFORM_WALLET } from "./config";
import { CreateListingParams, Listing } from "./types";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

// Import the IDL directly
import IDL from "./memeotc_platform.json";

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

    // Cast IDL properly with the correct type
    const program = new Program(IDL as Idl, provider);
    
    console.log("Program created successfully:", program.programId.toString());
    console.log("Program account methods:", Object.keys(program.account || {}));
    
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
      
      console.log("Fetching listing account:", listing.toString());
      
      // Fetch listing data
      const listingAccount = await program.account.listing.fetch(listing);
      
      console.log("Listing account data:", {
        seller: listingAccount.seller.toString(),
        tokenMint: listingAccount.tokenMint.toString(),
        tokenAmount: listingAccount.tokenAmount.toString(),
        totalPrice: listingAccount.totalPrice.toString(),
        isActive: listingAccount.isActive,
        listingNonce: listingAccount.listingNonce.toString()
      });

      // Generate escrow token account PDA
      const [escrowTokenAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), listing.toBuffer()],
        program.programId
      );

      // Get buyer's token account (will be created automatically)
      const buyerTokenAccount = await getAssociatedTokenAddress(
        listingAccount.tokenMint,
        wallet.publicKey
      );

      console.log("Buy listing accounts:", {
        listing: listing.toString(),
        buyer: wallet.publicKey.toString(),
        seller: listingAccount.seller.toString(),
        buyerTokenAccount: buyerTokenAccount.toString(),
        escrowTokenAccount: escrowTokenAccount.toString(),
        platformWallet: PLATFORM_WALLET
      });

      const tx = await program.methods
        .buyListing()
        .accounts({
          listing,
          buyer: wallet.publicKey,
          seller: listingAccount.seller,
          buyerTokenAccount,
          escrowTokenAccount,
          platformWallet: new PublicKey(PLATFORM_WALLET),
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .rpc();

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
          listing,
          seller: wallet.publicKey,
          sellerTokenAccount,
          escrowTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
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

  const getListings = async (): Promise<Listing[]> => {
    try {
      const program = getProgram();
      
      console.log("Fetching all listings...");
      
      // Check if program.account.listing exists
      if (!program.account?.listing) {
        console.error("Program account.listing is undefined");
        return [];
      }
      
      const listings = await program.account.listing.all();
      
      console.log(`Found ${listings.length} listings`);
      
      const now = Date.now() / 1000;
      
      return listings
        .map(listing => ({
          seller: listing.account.seller,
          tokenMint: listing.account.tokenMint,
          tokenAmount: listing.account.tokenAmount.toNumber(),
          totalPrice: listing.account.totalPrice.toNumber(),
          createdAt: listing.account.createdAt.toNumber(),
          expiresAt: listing.account.expiresAt.toNumber(),
          isActive: listing.account.isActive,
          listingNonce: listing.account.listingNonce.toNumber(),
          bump: listing.account.bump,
          escrowBump: listing.account.escrowBump,
        }))
        .filter(listing => listing.isActive && listing.expiresAt > now);
        
    } catch (error) {
      console.error("Error fetching listings:", error);
      return [];
    }
  };

  const getMyListings = async (): Promise<Listing[]> => {
    if (!wallet.publicKey) return [];
    
    try {
      const program = getProgram();
      
      if (!program.account?.listing) {
        console.error("Program account.listing is undefined");
        return [];
      }
      
      const listings = await program.account.listing.all([
        {
          memcmp: {
            offset: 8, // Skip discriminator
            bytes: wallet.publicKey.toBase58(),
          }
        }
      ]);
      
      return listings.map(listing => ({
        seller: listing.account.seller,
        tokenMint: listing.account.tokenMint,
        tokenAmount: listing.account.tokenAmount.toNumber(),
        totalPrice: listing.account.totalPrice.toNumber(),
        createdAt: listing.account.createdAt.toNumber(),
        expiresAt: listing.account.expiresAt.toNumber(),
        isActive: listing.account.isActive,
        listingNonce: listing.account.listingNonce.toNumber(),
        bump: listing.account.bump,
        escrowBump: listing.account.escrowBump,
      }));
      
    } catch (error) {
      console.error("Error fetching my listings:", error);
      return [];
    }
  };

  return {
    isAuthenticated,
    createListing,
    buyListing,
    cancelListing,
    getListings,
    getMyListings,
    isLoading,
  };
};
