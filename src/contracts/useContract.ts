import { useCallback, useMemo, useState } from "react";
import { AnchorProvider, BN, Idl, Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Connection, clusterApiUrl } from "@solana/web3.js";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import idl from "@/contracts/memeotc_contract.json";
import { MEMEOTC_CONFIG, PLATFORM_WALLET, RPC_URL } from "@/contracts/config";
import { toast } from "@/hooks/use-toast";
import type { CreateListingParams } from "@/contracts/types";
import { mapListingToDeal, type Deal } from "@/contracts/types";

// Helper to build an Anchor provider from wallet adapter
function getProvider(connection: Connection, walletAdapter: ReturnType<typeof useWallet>) {
  const { publicKey, signAllTransactions, signTransaction } = walletAdapter;
  const wallet = {
    publicKey: publicKey!,
    signAllTransactions: signAllTransactions!,
    signTransaction: signTransaction!,
  } as any; // Anchor Wallet compatible

  return new AnchorProvider(connection, wallet, {
    preflightCommitment: "confirmed",
    commitment: "confirmed",
  });
}

export const useContract = () => {
  const { publicKey, connected, signAllTransactions, signTransaction } = useWallet();
  const { connection: defaultConnection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);

  // Prefer custom RPC if provided
  const connection = useMemo(() => {
    if (RPC_URL) {
      return new Connection(RPC_URL, "confirmed");
    }
    return defaultConnection;
  }, [defaultConnection]);

  const program = useMemo(() => {
    if (!publicKey || !signAllTransactions || !signTransaction) return null;
    const provider = getProvider(connection, { publicKey, signAllTransactions, signTransaction } as any);
    return new (Program as any)(idl as any, MEMEOTC_CONFIG.programId, provider) as any;
  }, [connection, publicKey, signAllTransactions, signTransaction]);

  const isAuthenticated = !!publicKey && connected;

  // Fetch all active listings
  const getDeals = useCallback(async (): Promise<Deal[]> => {
    if (!program) return [];
    const listings = await program.account.listing.all();
    return listings
      .map((acc: any) => mapListingToDeal(acc.publicKey, acc.account as any))
      .filter((d) => !!d.status.Open);
  }, [program]);

  // Fetch listings belonging to current user
  const getMyDeals = useCallback(async (): Promise<Deal[]> => {
    if (!program || !publicKey) return [];
    const listings = await program.account.listing.all();
    return listings
      .map((acc) => mapListingToDeal(acc.publicKey, acc.account as any))
      .filter((d) => publicKey ? d.maker.equals(publicKey) : false);
  }, [program, publicKey]);

  // Internal helpers to derive PDAs
  const deriveListingPda = useCallback((seller: PublicKey, tokenMint: PublicKey, listingNonce: number) => {
    const [listing] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("listing"),
        seller.toBuffer(),
        tokenMint.toBuffer(),
        new BN(listingNonce).toArrayLike(Buffer, "le", 8),
      ],
      MEMEOTC_CONFIG.programId
    );
    return listing;
  }, []);

  const deriveEscrowPda = useCallback((listing: PublicKey) => {
    const [escrow] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), listing.toBuffer()],
      MEMEOTC_CONFIG.programId
    );
    return escrow;
  }, []);

  // Create a new listing (a.k.a. Deal)
  const createDeal = useCallback(
    async (params: CreateListingParams) => {
      if (!isAuthenticated || !publicKey) {
        throw new Error("Please connect your wallet first");
      }
      if (!program) throw new Error("Program not available");
      if (isLoading) return;
      setIsLoading(true);

      try {
        const tokenMint = new PublicKey(params.tokenMint);
        const listingNonce = params.listingNonce || Date.now();

        const listing = deriveListingPda(publicKey, tokenMint, listingNonce);
        const escrowTokenAccount = deriveEscrowPda(listing);
        const sellerTokenAccount = await getAssociatedTokenAddress(tokenMint, publicKey);

        // Optional UX check: ensure user has some balance (not enforced on-chain)
        try {
          const balance = await connection.getTokenAccountBalance(sellerTokenAccount);
          const tokenDecimals = balance.value.decimals;
          const requiredAmount = params.tokenAmount / Math.pow(10, tokenDecimals);
          if ((balance.value.uiAmount || 0) < requiredAmount) {
            throw new Error(`Insufficient token balance. You need ${requiredAmount} tokens.`);
          }
        } catch (e: any) {
          if (e?.message?.includes("could not find account")) {
            throw new Error("You don't have any balance of this token.");
          }
          // Re-throw other errors
          throw e;
        }

        const tx = await program.methods
          .createListing(
            new BN(params.tokenAmount),
            new BN(params.totalPrice),
            new BN(params.durationHours),
            new BN(listingNonce)
          )
          .accounts({
            listing,
            seller: publicKey,
            tokenMint,
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
        });

        setIsLoading(false);
        return { success: true, signature: tx, listingId: listing.toString() };
      } catch (error: any) {
        console.error("Error creating listing:", error);
        setIsLoading(false);
        toast({
          title: "Failed to Create Listing",
          description: error?.message || "Unknown error occurred",
          variant: "destructive",
        });
        throw error;
      }
    },
    [connection, deriveEscrowPda, deriveListingPda, isAuthenticated, isLoading, program, publicKey]
  );

  // Accept/buy a listing
  const acceptDeal = useCallback(
    async (listingId: string) => {
      if (!isAuthenticated || !publicKey) {
        throw new Error("Please connect your wallet first");
      }
      if (!program) throw new Error("Program not available");
      if (isLoading) return;
      setIsLoading(true);

      try {
        const listingPk = new PublicKey(listingId);
        const listingAcc = await program.account.listing.fetch(listingPk);
        const tokenMint = (listingAcc as any).tokenMint || (listingAcc as any).token_mint as PublicKey;
        const seller = (listingAcc as any).seller as PublicKey;

        const escrowTokenAccount = deriveEscrowPda(listingPk);
        const buyerTokenAccount = await getAssociatedTokenAddress(tokenMint, publicKey);

        const tx = await program.methods
          .buyListing()
          .accounts({
            listing: listingPk,
            seller,
            buyer: publicKey,
            tokenMint,
            escrowTokenAccount,
            buyerTokenAccount,
            platformWallet: new PublicKey(PLATFORM_WALLET),
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          })
          .rpc();

        toast({ title: "Deal Accepted", description: `Transaction: ${tx}` });
        setIsLoading(false);
        return { success: true, signature: tx };
      } catch (error: any) {
        console.error("Error accepting listing:", error);
        setIsLoading(false);
        toast({
          title: "Failed to Accept Deal",
          description: error?.message || "Unknown error occurred",
          variant: "destructive",
        });
        throw error;
      }
    },
    [deriveEscrowPda, isAuthenticated, isLoading, program, publicKey]
  );

  // Cancel a listing
  const cancelDeal = useCallback(
    async (listingId: string) => {
      if (!isAuthenticated || !publicKey) {
        throw new Error("Please connect your wallet first");
      }
      if (!program) throw new Error("Program not available");
      if (isLoading) return;
      setIsLoading(true);

      try {
        const listingPk = new PublicKey(listingId);
        const listingAcc = await program.account.listing.fetch(listingPk);
        const tokenMint = (listingAcc as any).tokenMint || (listingAcc as any).token_mint as PublicKey;
        const seller = (listingAcc as any).seller as PublicKey;

        if (!seller.equals(publicKey)) {
          throw new Error("Only the seller can cancel this listing");
        }

        const escrowTokenAccount = deriveEscrowPda(listingPk);
        const sellerTokenAccount = await getAssociatedTokenAddress(tokenMint, publicKey);

        const tx = await program.methods
          .cancelListing()
          .accounts({
            listing: listingPk,
            seller: publicKey,
            tokenMint,
            sellerTokenAccount,
            escrowTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        toast({ title: "Listing Cancelled", description: `Transaction: ${tx}` });
        setIsLoading(false);
        return { success: true, signature: tx };
      } catch (error: any) {
        console.error("Error cancelling listing:", error);
        setIsLoading(false);
        toast({
          title: "Failed to Cancel Listing",
          description: error?.message || "Unknown error occurred",
          variant: "destructive",
        });
        throw error;
      }
    },
    [deriveEscrowPda, isAuthenticated, isLoading, program, publicKey]
  );

  // Backward compat alias for previous naming in some components
  const createListing = createDeal;

  return {
    isAuthenticated,
    isLoading,
    createDeal,
    createListing,
    acceptDeal,
    cancelDeal,
    getDeals,
    getMyDeals,
  };
};
