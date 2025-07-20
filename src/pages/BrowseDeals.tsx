
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useContract } from '@/contracts/useContract';
import { Deal } from '@/contracts/types';
import { Coins, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';

const BrowseDeals = () => {
  const navigate = useNavigate();
  const { getDeals, acceptDeal, isAuthenticated } = useContract();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingDeal, setAcceptingDeal] = useState<number | null>(null);

  const loadDeals = async () => {
    setLoading(true);
    try {
      // Get only open deals from database
      const openDeals = await getDeals(true);
      setDeals(openDeals);
    } catch (error) {
      console.error('Failed to load deals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, []);

  const handleAcceptDeal = async (dealId: number) => {
    if (!isAuthenticated) {
      return;
    }

    setAcceptingDeal(dealId);
    try {
      await acceptDeal(dealId);
      await loadDeals(); // Refresh deals list
    } catch (error) {
      console.error('Failed to accept deal:', error);
    } finally {
      setAcceptingDeal(null);
    }
  };

  const formatTokenAmount = (amount: number) => {
    return (amount / 1e9).toFixed(4);
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

        {deals.length === 0 ? (
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
            {deals.map((deal) => (
              <Card key={deal.dealId} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Deal #{deal.dealId}</CardTitle>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeRemaining(deal.expiryTimestamp)}
                    </Badge>
                  </div>
                  <CardDescription>
                    Maker: {truncateAddress(deal.maker.toString())}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Offering Section */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">Offering</h4>
                    <div className="space-y-1">
                      <p className="text-lg font-bold">{formatTokenAmount(deal.amountOffered)}</p>
                      <p className="text-xs text-muted-foreground break-all">
                        {truncateAddress(deal.tokenMintOffered.toString())}
                      </p>
                    </div>
                  </div>

                  {/* Requesting Section */}
                  <div className="p-3 bg-primary/5 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">Requesting</h4>
                    <div className="space-y-1">
                      <p className="text-lg font-bold">{formatTokenAmount(deal.amountRequested)}</p>
                      <p className="text-xs text-muted-foreground break-all">
                        {truncateAddress(deal.tokenMintRequested.toString())}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button
                      onClick={() => handleAcceptDeal(deal.dealId)}
                      disabled={!isAuthenticated || acceptingDeal === deal.dealId}
                      className="w-full"
                    >
                      {acceptingDeal === deal.dealId ? 'Accepting...' : 'Accept Deal'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/deal/${deal.dealId}`)}
                      className="w-full"
                    >
                      View Details
                    </Button>
                  </div>

                  {!isAuthenticated && (
                    <p className="text-xs text-muted-foreground text-center">
                      Connect wallet to accept deals
                    </p>
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
