import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const LiveListings = () => {

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
                <TableHead>Token</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>24h Change</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="text-muted-foreground">
                    No active listings yet. Create your first deal to get started.
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Live Stats Bar */}
        <div className="glass-effect rounded-2xl p-6 animate-on-scroll">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold gradient-text-primary">0</div>
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