import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDatabase } from '@/hooks/useDatabase';
import { useRealtimeDeals } from '@/hooks/useRealtimeDeals';
import { useTokenMetadata } from '@/hooks/useTokenMetadata';
import { useContract } from '@/contracts/useContract';
import TokenDisplay from '@/components/TokenDisplay';

const LiveListings = () => {
  const navigate = useNavigate();
  const { getDeals } = useDatabase();
  const { generateListingPDAReadOnly } = useContract();
  const [deals, setDeals] = useState<any[]>([]);
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
      
      // Map deals to include PDA-based dealId like BrowseDeals does
      const mappedDeals = recentDeals.map(deal => {
        const listingPDA = generateListingPDAReadOnly(
          deal.maker_address,
          deal.token_mint_offered,
          deal.deal_id
        );
        return {
          ...deal,
          dealId: listingPDA || deal.deal_id.toString()
        };
      });
      
      setDeals(mappedDeals);
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

  const handleViewDeal = (dealId: string | number) => {
    // Convert scientific notation to string if needed
    const idString = typeof dealId === 'number' ? dealId.toString() : dealId;
    navigate(`/deal/${idString}`);
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
                          onClick={() => handleViewDeal(deal.dealId)}
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

      </div>
    </section>
  );
};

export default LiveListings;