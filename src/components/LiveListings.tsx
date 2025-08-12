import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDatabase } from '@/hooks/useDatabase';
import { useEffect, useState } from 'react';
import { TokenDisplay } from '@/components/TokenDisplay';
import { Button } from '@/components/ui/button';

const LiveListings = () => {
  const { getDeals } = useDatabase();
  const [deals, setDeals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDeals = async () => {
      try {
        const data = await getDeals(true); // Only open deals
        setDeals(data.slice(0, 5)); // Show first 5 deals
      } catch (error) {
        console.error('Error loading deals:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDeals();
  }, []);

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Offering</TableHead>
                <TableHead>Requesting</TableHead>
                <TableHead>Deal ID</TableHead>
                <TableHead>Maker</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
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
                  <TableRow key={deal.id}>
                    <TableCell>
                      <TokenDisplay
                        mintAddress={deal.token_mint_offered}
                        amount={`${(deal.amount_offered / Math.pow(10, 9)).toFixed(2)}`}
                        name={deal.token_offered_name}
                        symbol={deal.token_offered_symbol}
                        image={deal.token_offered_image}
                        showAmount={false}
                      />
                    </TableCell>
                    <TableCell>
                      <TokenDisplay
                        mintAddress={deal.token_mint_requested}
                        amount={`${(deal.amount_requested / Math.pow(10, 9)).toFixed(2)}`}
                        name={deal.token_requested_name}
                        symbol={deal.token_requested_symbol}
                        image={deal.token_requested_image}
                        showAmount={false}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      #{deal.deal_id.toString().slice(0, 8)}...
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {deal.maker_address.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline">
                        View Deal
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Live Stats Bar */}
        <div className="glass-effect rounded-2xl p-6 animate-on-scroll">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold gradient-text-primary">{deals.length}</div>
              <div className="text-sm text-muted-foreground">Active Listings</div>
            </div>
            <div>
              <div className="text-2xl font-bold gradient-text-accent">$0</div>
              <div className="text-sm text-muted-foreground">24h Volume</div>
            </div>
            <div>
              <div className="text-2xl font-bold gradient-text-meme">0s</div>
              <div className="text-sm text-muted-foreground">Avg Settlement</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">0%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveListings;