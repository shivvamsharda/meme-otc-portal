import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDatabase } from '@/hooks/useDatabase';
import { useRealtimeDeals } from '@/hooks/useRealtimeDeals';
import { useTokenMetadata } from '@/hooks/useTokenMetadata';
import TokenDisplay from '@/components/TokenDisplay';

const LiveListings = () => {
  const navigate = useNavigate();
  const { getDeals } = useDatabase();
  const [deals, setDeals] = useState<any[]>([]);
  const [stats, setStats] = useState({
    activeListings: 0,
    volume24h: 0,
    avgSettlement: 0,
    successRate: 0
  });
  const [loading, setLoading] = useState(true);

  // Extract unique mint addresses for metadata fetching
  const mintAddresses = deals.flatMap(deal => [
    deal.token_mint_offered,
    deal.token_mint_requested
  ]).filter(Boolean);

  const { metadata: tokenMetadata } = useTokenMetadata(mintAddresses);

  const fetchDeals = async () => {
    try {
      const openDeals = await getDeals(true); // Only open deals
      const recentDeals = openDeals.slice(0, 5); // Limit to 5
      setDeals(recentDeals);
      
      // Calculate stats
      const allDeals = await getDeals(false);
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const completedDeals = allDeals.filter(deal => deal.status === 'Completed');
      const recentCompleted = completedDeals.filter(deal => 
        new Date(deal.completed_at || deal.updated_at) > yesterday
      );
      
      setStats({
        activeListings: openDeals.length,
        volume24h: recentCompleted.length,
        avgSettlement: 0, // Could calculate average time if needed
        successRate: allDeals.length > 0 ? Math.round((completedDeals.length / allDeals.length) * 100) : 0
      });
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  useRealtimeDeals(fetchDeals);

  const handleViewDeal = (dealId: string) => {
    navigate(`/deal/${dealId}`);
  };

  return (
    <section className="py-32 relative">
      <div className="container mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 animate-on-scroll">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Live <span className="gradient-text-accent">OTC Listings</span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Real-time peer-to-peer deals happening now. Join the action.
          </p>
        </div>

        {/* Listings Table */}
        <div className="card-glow rounded-2xl p-6 mb-12 animate-on-scroll">
          <ScrollArea className="h-80">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token Offered</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Token Requested</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="text-muted-foreground">Loading deals...</div>
                    </TableCell>
                  </TableRow>
                ) : deals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="text-muted-foreground">
                        No active listings yet. Create your first deal to get started.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  deals.map((deal) => (
                    <TableRow key={deal.deal_id} className="hover:bg-muted/50">
                      <TableCell>
                        <TokenDisplay
                          mintAddress={deal.token_mint_offered}
                          metadata={tokenMetadata.get(deal.token_mint_offered)}
                          storedSymbol={deal.token_offered_symbol}
                          storedName={deal.token_offered_name}
                          storedImage={deal.token_offered_image}
                          showImage={true}
                          showFullName={true}
                          imageSize="md"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {deal.amount_offered_display?.toLocaleString() || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <TokenDisplay
                          mintAddress={deal.token_mint_requested}
                          metadata={tokenMetadata.get(deal.token_mint_requested)}
                          storedSymbol={deal.token_requested_symbol}
                          storedName={deal.token_requested_name}
                          storedImage={deal.token_requested_image}
                          showImage={true}
                          showFullName={true}
                          imageSize="md"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {deal.amount_requested_display?.toLocaleString() || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDeal(deal.deal_id)}
                        >
                          View Deal
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {/* Live Stats Bar */}
        <div className="glass-effect rounded-2xl p-6 animate-on-scroll">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold gradient-text-primary">{stats.activeListings}</div>
              <div className="text-sm text-muted-foreground">Active Listings</div>
            </div>
            <div>
              <div className="text-2xl font-bold gradient-text-accent">{stats.volume24h}</div>
              <div className="text-sm text-muted-foreground">24h Completions</div>
            </div>
            <div>
              <div className="text-2xl font-bold gradient-text-meme">{stats.avgSettlement}min</div>
              <div className="text-sm text-muted-foreground">Avg Settlement</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">{stats.successRate}%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveListings;