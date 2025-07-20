
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useContract } from '@/contracts/useContract';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Coins, Calendar, DollarSign } from 'lucide-react';
import Navbar from '@/components/Navbar';

const CreateDeal = () => {
  const navigate = useNavigate();
  const { createDeal, isAuthenticated } = useContract();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tokenMintOffered: '',
    amountOffered: '',
    tokenMintRequested: '',
    amountRequested: '',
    expiryDays: '7',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to create a deal",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const dealId = Math.floor(Math.random() * 1000000); // Generate random deal ID
      const expiryTimestamp = Math.floor(Date.now() / 1000) + (parseInt(formData.expiryDays) * 24 * 60 * 60);
      
      await createDeal({
        dealId,
        tokenMintOffered: formData.tokenMintOffered,
        amountOffered: parseFloat(formData.amountOffered) * 1e9, // Convert to lamports
        tokenMintRequested: formData.tokenMintRequested,
        amountRequested: parseFloat(formData.amountRequested) * 1e9, // Convert to lamports
        expiryTimestamp,
      });

      toast({
        title: "Deal Created!",
        description: "Your OTC deal has been created successfully",
        className: "border-green-200 bg-green-50 text-green-900",
      });

      navigate('/deals');
    } catch (error) {
      console.error('Failed to create deal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-6 pt-24 pb-12">
        <div className="max-w-2xl mx-auto">
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
            <div>
              <h1 className="text-3xl font-bold">Create OTC Deal</h1>
              <p className="text-muted-foreground">Set up a new over-the-counter trade</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5" />
                Deal Details
              </CardTitle>
              <CardDescription>
                Create a new OTC deal by specifying what you're offering and what you want in return.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Token Offered Section */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    What You're Offering
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tokenMintOffered">Token Mint Address</Label>
                      <Input
                        id="tokenMintOffered"
                        placeholder="Enter token mint address"
                        value={formData.tokenMintOffered}
                        onChange={(e) => handleInputChange('tokenMintOffered', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="amountOffered">Amount</Label>
                      <Input
                        id="amountOffered"
                        type="number"
                        step="0.000000001"
                        placeholder="0.0"
                        value={formData.amountOffered}
                        onChange={(e) => handleInputChange('amountOffered', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Token Requested Section */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Coins className="w-4 h-4" />
                    What You Want
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tokenMintRequested">Token Mint Address</Label>
                      <Input
                        id="tokenMintRequested"
                        placeholder="Enter token mint address"
                        value={formData.tokenMintRequested}
                        onChange={(e) => handleInputChange('tokenMintRequested', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="amountRequested">Amount</Label>
                      <Input
                        id="amountRequested"
                        type="number"
                        step="0.000000001"
                        placeholder="0.0"
                        value={formData.amountRequested}
                        onChange={(e) => handleInputChange('amountRequested', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Expiry Section */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Deal Expiry
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="expiryDays">Expires in (days)</Label>
                    <Input
                      id="expiryDays"
                      type="number"
                      min="1"
                      max="30"
                      value={formData.expiryDays}
                      onChange={(e) => handleInputChange('expiryDays', e.target.value)}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Deal will expire in {formData.expiryDays} day(s)
                    </p>
                  </div>
                </div>

                {/* Platform Fee Notice */}
                <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Platform Fee:</strong> 0.5% of the offered token amount will be charged when the deal is completed.
                  </p>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading || !isAuthenticated}
                  className="w-full"
                >
                  {loading ? 'Creating Deal...' : 'Create Deal'}
                </Button>
                
                {!isAuthenticated && (
                  <p className="text-sm text-muted-foreground text-center">
                    Please connect your wallet to create a deal
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateDeal;
