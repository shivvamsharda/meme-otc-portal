import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useContract } from '@/contracts/useContract';
import { Deal } from '@/contracts/types';
import { getTokenByMint } from '@/contracts/tokens';
import { Coins, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useTransactionState } from '@/hooks/useTransactionState';
import { toast } from '@/hooks/use-toast';
import { useDatabase } from '@/hooks/useDatabase';
import { useRealtimeDeals } from '@/hooks/useRealtimeDeals';
import { useTokenMetadata } from '@/hooks/useTokenMetadata';
import TokenDisplay from '@/components/TokenDisplay';

const BrowseDeals = () => {
  const navigate = useNavigate();
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const contract = useContract();
  const { getDeals, acceptDeal, isAuthenticated } = contract;
  const database = useDatabase();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { state: txState, setStep, reset: resetTxState, getStepMessage } = useTransactionState();

  // Get unique token mints for metadata fetching
  const tokenMints = Array.from(
    new Set([
      ...deals.map(deal => deal.tokenMintOffered?.toString()).filter(Boolean),
      ...deals.map(deal => deal.tokenMintRequested?.toString()).filter(Boolean),
    ])
  );

  const { metadata: tokenMetadata, loading: metadataLoading } = useTokenMetadata(tokenMints);

  const loadDeals = async () => {
    setLoading(true);
    try {
      // Load deals from database only
      const dbDeals = await database.getDeals(true); // only 'Open' deals
      const mappedDeals = dbDeals.map(deal => {
        // Generate the proper listing PDA address
        const listingPDA = contract.generateListingPDAReadOnly(
          deal.maker_address,
          deal.token_mint_offered,
          deal.deal_id
        );
        
        return {
          seller: { toString: () => deal.maker_address } as any,
          maker: new PublicKey(deal.maker_address),
          tokenMint: { toString: () => deal.token_mint_offered } as any,
          tokenAmount: deal.amount_offered,
          totalPrice: deal.amount_requested,
          createdAt: new Date(deal.created_at).getTime() / 1000,
          expiresAt: new Date(deal.expiry_timestamp).getTime() / 1000,
          isActive: deal.status === 'Open',
          listingNonce: deal.deal_id,
          bump: deal.escrow_bump || 0,
          escrowBump: deal.escrow_bump || 0,
          dealId: listingPDA || deal.deal_id.toString(), // Use PDA or fallback to deal_id
          status: { [deal.status.toLowerCase()]: {} },
          expiryTimestamp: new Date(deal.expiry_timestamp).getTime() / 1000,
          amountOffered: deal.amount_offered,
          amountOfferedDisplay: deal.amount_offered_display,
          tokenMintOffered: { toString: () => deal.token_mint_offered } as any,
          amountRequested: deal.amount_requested,
          amountRequestedDisplay: deal.amount_requested_display,
          tokenMintRequested: { toString: () => deal.token_mint_requested } as any,
          completedAt: deal.completed_at ? new Date(deal.completed_at).getTime() / 1000 : null
        };
      });
      setDeals(mappedDeals);
    } catch (error) {
      console.error('Failed to load deals:', error);
      toast({
        title: "Failed to Load Deals",
        description: "Unable to fetch deals. Please try refreshing.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, []);

  // Realtime updates: refresh whenever deals table changes
  useRealtimeDeals(loadDeals);


  const handleAcceptDeal = async (dealId: string) => {
    if (!isAuthenticated) {
      return;
    }

    // Prevent duplicate submissions
    if (txState.isLoading) {
      console.log("Transaction already in progress, ignoring duplicate request");
      return;
    }

    resetTxState();
    setStep('validating');

    try {
      const result = await acceptDeal(dealId);
      
      if (result.success) {
        setStep('complete', undefined, result.signature);
        
        // Show success toast
        toast({
          title: "Deal Accepted Successfully!",
          description: `Transaction: ${result.signature}`,
          className: "border-green-200 bg-green-50 text-green-900",
        });

        // Optimistically remove the accepted deal from the UI
        setDeals(prev => prev.filter(d => (d.dealId as string) !== dealId));

        // Refresh deals list after successful transaction
        await loadDeals();
      }
    } catch (error) {
      console.error('Failed to accept deal:', error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setStep('error', errorMessage);
      
      toast({
        title: "Failed to Accept Deal",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Simple token amount formatting without network calls
  const formatTokenAmount = (amount: number | string, mintAddress: string) => {
    const tokenInfo = getTokenByMint(mintAddress);
    const decimals = tokenInfo?.decimals || 9; // Use static decimals from registry or default to 9

    const numeric = typeof amount === 'number' ? amount : Number(amount);
    const displayAmount = numeric / Math.pow(10, decimals);
    return displayAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  };

  // Get token display info
  const getTokenDisplayInfo = (mintAddress: string) => {
    const tokenInfo = getTokenByMint(mintAddress);
    return {
      symbol: tokenInfo?.symbol || truncateAddress(mintAddress),
      name: tokenInfo?.name || 'Unknown Token'
    };
  };

  const formatTimeRemaining = (expiryTimestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = expiryTimestamp - now;
    
    if (remaining <= 0) return 'Expired';
    
    const days = Math.floor(remaining / (24 * 60 * 60));
    const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Helper functions for deal visibility
  const isDealExpired = (expiryTimestamp: number): boolean => {
    const now = Math.floor(Date.now() / 1000);
    return expiryTimestamp <= now;
  };

  const isDealOwner = (deal: Deal, userPublicKey: PublicKey | null): boolean => {
    return userPublicKey ? deal.maker.equals(userPublicKey) : false;
  };

  // Filter deals to hide expired deals from non-owners
  const visibleDeals = deals.filter(deal => {
    if (!isDealExpired(deal.expiryTimestamp)) {
      return true; // Show all non-expired deals
    }
    return isDealOwner(deal, publicKey); // Only show expired deals to owners
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 pt-24 pb-12">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-6 pt-24 pb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Browse Deals</h1>
            <p className="text-muted-foreground">Discover and accept OTC trading opportunities</p>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={loadDeals}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => navigate('/create-deal')}
              className="flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Create Deal
            </Button>
          </div>
        </div>

        {visibleDeals.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Coins className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Open Deals</h3>
              <p className="text-muted-foreground mb-4">
                There are currently no open deals available.
              </p>
              <Button onClick={() => navigate('/create-deal')}>
                Create the First Deal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleDeals.map((deal) => (
              <Card key={deal.dealId} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between min-w-0">
                    <CardTitle className="text-lg truncate min-w-0">
                      Deal #{typeof deal.dealId === 'string' ? deal.dealId.slice(0, 8) + '...' : deal.dealId}
                    </CardTitle>
                    <Badge variant="secondary" className="flex items-center gap-1 flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatTimeRemaining(deal.expiryTimestamp)}
                    </Badge>
                  </div>
                  <CardDescription className="truncate">
                    Maker: {truncateAddress(deal.maker.toString())}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Offering Section */}
                  <div className="p-3 bg-muted/50 rounded-lg min-w-0">
                    <h4 className="font-semibold text-sm mb-2">Offering</h4>
                    <div className="space-y-3 min-w-0">
                       <div className="min-w-0">
                         <p className="text-lg font-bold truncate mb-2">
                           {(deal as any).amountOfferedDisplay ?? formatTokenAmount((deal as any).amountOfferedRaw ?? (deal as any).amountOffered, deal.tokenMintOffered.toString())}
                         </p>
                         <TokenDisplay
                           mintAddress={deal.tokenMintOffered.toString()}
                           metadata={tokenMetadata.get(deal.tokenMintOffered.toString())}
                           storedSymbol={deal.tokenOfferedSymbol}
                           storedName={deal.tokenOfferedName}
                           storedImage={deal.tokenOfferedImage}
                           loading={metadataLoading}
                           showFullName={true}
                           showImage={true}
                           imageSize="md"
                         />
                      </div>
                    </div>
                  </div>

                  {/* Requesting Section */}
                  <div className="p-3 bg-primary/5 rounded-lg min-w-0">
                    <h4 className="font-semibold text-sm mb-2">Requesting</h4>
                    <div className="space-y-3 min-w-0">
                       <div className="min-w-0">
                         <p className="text-lg font-bold truncate mb-2">
                           {(deal as any).amountRequestedDisplay ?? formatTokenAmount(deal.amountRequested, deal.tokenMintRequested.toString())}
                         </p>
                         <TokenDisplay
                           mintAddress={deal.tokenMintRequested.toString()}
                           metadata={tokenMetadata.get(deal.tokenMintRequested.toString())}
                           storedSymbol={deal.tokenRequestedSymbol}
                           storedName={deal.tokenRequestedName}
                           storedImage={deal.tokenRequestedImage}
                           loading={metadataLoading}
                           showFullName={true}
                           showImage={true}
                           imageSize="md"
                         />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                     <Button
                      onClick={() => handleAcceptDeal(deal.dealId as string)}
                      disabled={!isAuthenticated || txState.isLoading}
                      className="w-full min-w-0"
                    >
                      <span className="truncate">
                        {txState.isLoading ? getStepMessage(txState.step) : 'Accept Deal'}
                      </span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/deal/${deal.dealId}`)}
                      className="w-full min-w-0"
                    >
                      <span className="truncate">View Details</span>
                    </Button>
                  </div>

                  {!isAuthenticated && (
                    <p className="text-xs text-muted-foreground text-center">
                      Connect wallet to accept deals
                    </p>
                  )}

                  {/* Transaction Progress */}
                  {txState.isLoading && (
                    <div className="text-xs text-center text-muted-foreground truncate">
                      {getStepMessage(txState.step)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


export default BrowseDeals;
