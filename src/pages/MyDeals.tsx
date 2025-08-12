
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useContract } from '@/contracts/useContract';
import { Deal } from '@/contracts/types';
import { getTokenByMint } from '@/contracts/tokens';
import { Coins, Clock, RefreshCw, TrendingUp, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useRealtimeDeals } from '@/hooks/useRealtimeDeals';

const MyDeals = () => {
  const navigate = useNavigate();
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { getMyDeals, cancelDeal, isAuthenticated } = useContract();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingDeal, setCancellingDeal] = useState<string | null>(null);
  const [tokenDecimalsCache, setTokenDecimalsCache] = useState<Map<string, number>>(new Map());

  const loadMyDeals = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const myDeals = await getMyDeals();
      setDeals(myDeals);
    } catch (error) {
      console.error('Failed to load my deals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyDeals();
  }, [isAuthenticated]);

  // Realtime updates: refresh whenever deals table changes
  useRealtimeDeals(loadMyDeals);

  const handleCancelDeal = async (dealId: string) => {
    setCancellingDeal(dealId);
    try {
      await cancelDeal(dealId);
      await loadMyDeals(); // Refresh deals list
    } catch (error) {
      console.error('Failed to cancel deal:', error);
    } finally {
      setCancellingDeal(null);
    }
  };

  // Get token decimals with caching
  const getTokenDecimals = async (mintAddress: string): Promise<number> => {
    if (tokenDecimalsCache.has(mintAddress)) {
      return tokenDecimalsCache.get(mintAddress)!;
    }

    try {
      const tokenMintInfo = await connection.getAccountInfo(new PublicKey(mintAddress));
      if (tokenMintInfo && tokenMintInfo.data.length >= 45) {
        const decimals = tokenMintInfo.data[44];
        setTokenDecimalsCache(prev => new Map(prev).set(mintAddress, decimals));
        return decimals;
      }
    } catch (error) {
      console.warn("Error fetching token decimals:", error);
    }
    
    // Fallback to 9 decimals
    setTokenDecimalsCache(prev => new Map(prev).set(mintAddress, 9));
    return 9;
  };

  const formatTokenAmount = async (amount: number | string, mintAddress: string) => {
    const decimals = await getTokenDecimals(mintAddress);

    if (typeof amount === 'string') {
      try {
        const base = BigInt(10) ** BigInt(decimals);
        const amt = BigInt(amount);
        // scale to 4 decimal places for display without floating point errors
        const scaled = (amt * 10000n) / base;
        const intPart = scaled / 10000n;
        const fracPart = scaled % 10000n;
        const fracStr = fracPart.toString().padStart(4, '0');
        const numStr = `${intPart.toString()}.${fracStr}`;
        return Number(numStr).toLocaleString(undefined, {
          minimumFractionDigits: 4,
          maximumFractionDigits: 4,
        });
      } catch (e) {
        console.warn('Failed to format big amount, falling back');
      }
    }

    const numeric = typeof amount === 'number' ? amount : Number(amount);
    const displayAmount = numeric / Math.pow(10, decimals);
    return displayAmount.toLocaleString(undefined, {
      minimumFractionDigits: 4,
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

  const getStatusBadge = (status: any) => {
    if ('Open' in status) return <Badge variant="secondary">Open</Badge>;
    if ('InProgress' in status) return <Badge variant="default">In Progress</Badge>;
    if ('Completed' in status) return <Badge variant="default" className="bg-green-500">Completed</Badge>;
    if ('Cancelled' in status) return <Badge variant="destructive">Cancelled</Badge>;
    return <Badge variant="outline">Unknown</Badge>;
  };

  const isMyDeal = (deal: Deal) => {
    return publicKey && deal.maker.equals(publicKey);
  };

  const canCancelDeal = (deal: Deal) => {
    return isMyDeal(deal) && 'Open' in deal.status;
  };

  const myCreatedDeals = deals.filter(deal => isMyDeal(deal));
  const myAcceptedDeals = deals.filter(deal => !isMyDeal(deal));

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 pt-24 pb-12">
          <Card className="text-center py-12">
            <CardContent>
              <Coins className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Wallet Not Connected</h3>
              <p className="text-muted-foreground">
                Please connect your wallet to view your deals.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const DealCard = ({ deal }: { deal: Deal }) => (
    <Card key={deal.dealId} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Deal #{deal.dealId}</CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge(deal.status)}
            {'Open' in deal.status && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTimeRemaining(deal.expiryTimestamp)}
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>
          {isMyDeal(deal) ? 'Created by you' : `Accepted from ${truncateAddress(deal.maker.toString())}`}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Deal Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">
              {isMyDeal(deal) ? 'You Offer' : 'You Get'}
            </h4>
            <div className="space-y-1">
              <TokenAmountDisplay 
                amount={deal.amountOffered}
                mintAddress={deal.tokenMintOffered.toString()}
                formatTokenAmount={formatTokenAmount}
                getTokenDisplayInfo={getTokenDisplayInfo}
              />
              <p className="text-xs text-muted-foreground break-all">
                {truncateAddress(deal.tokenMintOffered.toString())}
              </p>
            </div>
          </div>

          <div className="p-3 bg-primary/5 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">
              {isMyDeal(deal) ? 'You Get' : 'You Pay'}
            </h4>
            <div className="space-y-1">
              <TokenAmountDisplay 
                amount={deal.amountRequested}
                mintAddress={deal.tokenMintRequested.toString()}
                formatTokenAmount={formatTokenAmount}
                getTokenDisplayInfo={getTokenDisplayInfo}
              />
              <p className="text-xs text-muted-foreground break-all">
                {truncateAddress(deal.tokenMintRequested.toString())}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/deal/${deal.dealId}`)}
            className="flex-1"
          >
            View Details
          </Button>
          
          {canCancelDeal(deal) && (
            <Button
              variant="destructive"
              onClick={() => handleCancelDeal(deal.dealId as string)}
              disabled={cancellingDeal === deal.dealId}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              {cancellingDeal === deal.dealId ? 'Cancelling...' : 'Cancel'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-6 pt-24 pb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Deals</h1>
            <p className="text-muted-foreground">Manage your OTC trading activities</p>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={loadMyDeals}
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

        <Tabs defaultValue="created" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="created">
              Created Deals ({myCreatedDeals.length})
            </TabsTrigger>
            <TabsTrigger value="accepted">
              Accepted Deals ({myAcceptedDeals.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="created" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>
            ) : myCreatedDeals.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Coins className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Created Deals</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't created any deals yet.
                  </p>
                  <Button onClick={() => navigate('/create-deal')}>
                    Create Your First Deal
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myCreatedDeals.map(deal => <DealCard key={deal.dealId} deal={deal} />)}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="accepted" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>
            ) : myAcceptedDeals.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Coins className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Accepted Deals</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't accepted any deals yet.
                  </p>
                  <Button onClick={() => navigate('/deals')}>
                    Browse Available Deals
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myAcceptedDeals.map(deal => <DealCard key={deal.dealId} deal={deal} />)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Component to handle async token amount display
const TokenAmountDisplay = ({ 
  amount, 
  mintAddress, 
  formatTokenAmount, 
  getTokenDisplayInfo 
}: {
  amount: number | string;
  mintAddress: string;
  formatTokenAmount: (amount: number | string, mintAddress: string) => Promise<string>;
  getTokenDisplayInfo: (mintAddress: string) => { symbol: string; name: string };
}) => {
  const [formattedAmount, setFormattedAmount] = useState<string>('...');
  
  useEffect(() => {
    formatTokenAmount(amount, mintAddress).then(setFormattedAmount);
  }, [amount, mintAddress, formatTokenAmount]);
  
  const tokenInfo = getTokenDisplayInfo(mintAddress);
  
  return (
    <p className="text-lg font-bold">
      {formattedAmount} {tokenInfo.symbol}
    </p>
  );
};

export default MyDeals;
