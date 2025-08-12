import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useContract } from '@/contracts/useContract';
import { Deal } from '@/contracts/types';
import { useWallet } from '@solana/wallet-adapter-react';
import { ArrowLeft, Clock, User, Coins, Calendar, CheckCircle, X, RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import TokenDisplay from '@/components/TokenDisplay';
import { useTokenMetadata } from '@/hooks/useTokenMetadata';

const DealDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { publicKey } = useWallet();
  const { getDeals, acceptDeal, cancelDeal, isAuthenticated, isLoading } = useContract();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  const loadDeal = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const allDeals = await getDeals();
      console.log('Looking for deal with ID:', id);
      console.log('All deals:', allDeals.map(d => ({ dealId: d.dealId, deal_id: (d as any).deal_id })));
      
      // Try to find deal by both dealId and deal_id fields
      const foundDeal = allDeals.find(d => {
        const dealIdMatch = d.dealId && d.dealId.toString() === id;
        const dealDbIdMatch = (d as any).deal_id && (d as any).deal_id.toString() === id;
        return dealIdMatch || dealDbIdMatch;
      });
      
      console.log('Found deal:', foundDeal);
      setDeal(foundDeal || null);
    } catch (error) {
      console.error('Failed to load deal:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeal();
  }, [id]);

  const handleAcceptDeal = async () => {
    if (!deal || !isAuthenticated) return;
    
    setAccepting(true);
    try {
      await acceptDeal(deal.dealId);
      await loadDeal(); // Refresh deal data
    } catch (error) {
      console.error('Failed to accept deal:', error);
    } finally {
      setAccepting(false);
    }
  };

  const handleCancelDeal = async () => {
    if (!deal || !isAuthenticated || isLoading) return;
    
    try {
      await cancelDeal(deal.dealId);
      await loadDeal(); // Refresh deal data
    } catch (error) {
      // Error handling is now done in the useContract hook
      console.log('Cancel deal completed');
    }
  };

  // Get token metadata for both tokens
  const { metadata } = useTokenMetadata(
    deal ? [deal.tokenMintOffered.toString(), deal.tokenMintRequested.toString()] : []
  );

  const getDisplayAmount = (amount: number, isDisplay?: boolean) => {
    // If we have display amount, use it directly
    if (isDisplay !== undefined) {
      return amount.toString();
    }
    // Fallback to base units conversion (legacy deals)
    return (amount / 1e9).toString();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatTimeRemaining = (expiryTimestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = expiryTimestamp - now;
    
    if (remaining <= 0) return 'Expired';
    
    const days = Math.floor(remaining / (24 * 60 * 60));
    const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((remaining % (60 * 60)) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusBadge = (status: any) => {
    if ('Open' in status) return <Badge variant="secondary">Open</Badge>;
    if ('InProgress' in status) return <Badge variant="default">In Progress</Badge>;
    if ('Completed' in status) return <Badge variant="default" className="bg-green-500">Completed</Badge>;
    if ('Cancelled' in status) return <Badge variant="destructive">Cancelled</Badge>;
    return <Badge variant="outline">Unknown</Badge>;
  };

  const isMyDeal = () => {
    return deal && publicKey && deal.maker.equals(publicKey);
  };

  const canAcceptDeal = () => {
    return deal && publicKey && !deal.maker.equals(publicKey) && 'Open' in deal.status;
  };

  const canCancelDeal = () => {
    return deal && publicKey && deal.maker.equals(publicKey) && 'Open' in deal.status;
  };

  // Helper functions for deal visibility
  const isDealExpired = (expiryTimestamp: number): boolean => {
    const now = Math.floor(Date.now() / 1000);
    return expiryTimestamp <= now;
  };

  const isDealOwner = (deal: Deal, userPublicKey: typeof publicKey): boolean => {
    return userPublicKey ? deal.maker.equals(userPublicKey) : false;
  };

  // Check if current user can view this expired deal
  const canViewExpiredDeal = (deal: Deal): boolean => {
    if (!isDealExpired(deal.expiryTimestamp)) {
      return true; // Non-expired deals are visible to everyone
    }
    return isDealOwner(deal, publicKey); // Only owners can see expired deals
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

  if (!deal) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 pt-24 pb-12">
          <Card className="text-center py-12">
            <CardContent>
              <h3 className="text-lg font-semibold mb-2">Deal Not Found</h3>
              <p className="text-muted-foreground mb-4">
                The deal you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate('/deals')}>
                Browse All Deals
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Hide expired deals from non-owners
  if (!canViewExpiredDeal(deal)) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 pt-24 pb-12">
          <Card className="text-center py-12">
            <CardContent>
              <h3 className="text-lg font-semibold mb-2">Deal Not Available</h3>
              <p className="text-muted-foreground mb-4">
                This deal has expired and is only visible to its creator.
              </p>
              <Button onClick={() => navigate('/deals')}>
                Browse Available Deals
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-6 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">Deal #{deal.dealId}</h1>
                {getStatusBadge(deal.status)}
              </div>
              <p className="text-muted-foreground">
                {isMyDeal() ? 'Created by you' : `Created by ${deal.maker.toString()}`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Deal Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Deal Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="w-5 h-5" />
                    Deal Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Token Exchange */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-3 text-lg">
                        {isMyDeal() ? 'You Offer' : 'Maker Offers'}
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold">
                            {deal.amountOfferedDisplay ?? getDisplayAmount(deal.amountOffered)}
                          </span>
                          <TokenDisplay
                            mintAddress={deal.tokenMintOffered.toString()}
                            metadata={metadata.get(deal.tokenMintOffered.toString())}
                            storedSymbol={deal.tokenOfferedSymbol}
                            storedName={deal.tokenOfferedName}
                            storedImage={deal.tokenOfferedImage}
                            showFullName={true}
                            imageSize="md"
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Token Mint:</p>
                          <p className="text-sm font-mono break-all bg-muted p-2 rounded">
                            {deal.tokenMintOffered.toString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-3 text-lg">
                        {isMyDeal() ? 'You Request' : 'Maker Requests'}
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-green-600">
                            {deal.amountRequestedDisplay ?? getDisplayAmount(deal.amountRequested)}
                          </span>
                          <TokenDisplay
                            mintAddress={deal.tokenMintRequested.toString()}
                            metadata={metadata.get(deal.tokenMintRequested.toString())}
                            storedSymbol={deal.tokenRequestedSymbol}
                            storedName={deal.tokenRequestedName}
                            storedImage={deal.tokenRequestedImage}
                            showFullName={true}
                            imageSize="md"
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Token Mint:</p>
                          <p className="text-sm font-mono break-all bg-muted p-2 rounded">
                            {deal.tokenMintRequested.toString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Exchange Rate */}
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Exchange Rate</h4>
                    <p className="text-lg">
                      1 {deal.tokenOfferedSymbol || metadata.get(deal.tokenMintOffered.toString())?.symbol || 'Token'} = {
                        (() => {
                          const offeredAmount = deal.amountOfferedDisplay ?? parseFloat(getDisplayAmount(deal.amountOffered));
                          const requestedAmount = deal.amountRequestedDisplay ?? parseFloat(getDisplayAmount(deal.amountRequested));
                          return (requestedAmount / offeredAmount).toFixed(6);
                        })()
                      } {deal.tokenRequestedSymbol || metadata.get(deal.tokenMintRequested.toString())?.symbol || 'Tokens'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Transaction History */}
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="font-semibold">Deal Created</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(deal.createdAt)}
                        </p>
                      </div>
                    </div>

                    {deal.completedAt > 0 && (
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="font-semibold">Deal Completed</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(deal.completedAt)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Deal Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Deal Status  
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    {getStatusBadge(deal.status)}
                  </div>

                  {'Open' in deal.status && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Time Remaining</p>
                      <p className="text-lg font-semibold">
                        {formatTimeRemaining(deal.expiryTimestamp)}
                      </p>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{formatDate(deal.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expires:</span>
                      <span>{formatDate(deal.expiryTimestamp)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Maker Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Deal Maker
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-mono break-all bg-muted p-3 rounded">
                    {deal.maker.toString()}
                  </div>
                  {isMyDeal() && (
                    <p className="text-sm text-muted-foreground mt-2">This is your deal</p>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              {isAuthenticated && (
                <Card>
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {canAcceptDeal() && (
                      <Button
                        onClick={handleAcceptDeal}
                        disabled={accepting}
                        className="w-full"
                      >
                        {accepting ? 'Accepting Deal...' : 'Accept Deal'}
                      </Button>
                    )}

                    {canCancelDeal() && (
                      <Button
                        variant="destructive"
                        onClick={handleCancelDeal}
                        disabled={isLoading}
                        className="w-full flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        {isLoading ? 'Cancelling...' : 'Cancel Deal'}
                      </Button>
                    )}

                    {!canAcceptDeal() && !canCancelDeal() && 'Open' in deal.status && (
                      <p className="text-sm text-muted-foreground text-center">
                        You cannot accept your own deal
                      </p>
                    )}

                    {!('Open' in deal.status) && (
                      <p className="text-sm text-muted-foreground text-center">
                        This deal is no longer active
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Platform Fee Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Platform Fee
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p>Platform fee: <strong>0.5%</strong></p>
                    <p className="text-muted-foreground">
                      Fee is charged on the offered token amount when the deal is completed.
                    </p>
                    <p>
                      Fee amount: <strong>
                        {((deal.amountOfferedDisplay ?? parseFloat(getDisplayAmount(deal.amountOffered))) * 0.005).toFixed(6)} {deal.tokenOfferedSymbol || metadata.get(deal.tokenMintOffered.toString())?.symbol || 'tokens'}
                      </strong>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealDetails;
