
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useContract } from '@/contracts/useContract';
import { toast } from '@/hooks/use-toast';
import { useTransactionState } from '@/hooks/useTransactionState';
import { generateUniqueDealId, validateDealParams } from '@/utils/dealUtils';
import { ArrowLeft, Coins, Calendar, DollarSign, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';

const CreateDeal = () => {
  const navigate = useNavigate();
  const { publicKey } = useWallet();
  const { createDeal, isAuthenticated } = useContract();
  const { state: txState, setStep, reset } = useTransactionState();
  const [formData, setFormData] = useState({
    tokenMintOffered: '',
    amountOffered: '',
    tokenMintRequested: '',
    amountRequested: '',
    expiryDays: '7',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !publicKey) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to create a deal",
        variant: "destructive",
      });
      return;
    }

    // Prevent double submission
    if (txState.isLoading) {
      console.log("Transaction already in progress, ignoring duplicate request");
      return;
    }

    reset();
    setStep('validating');

    try {
      // Validate form data
      const validationError = validateDealParams(formData);
      if (validationError) {
        setStep('error', validationError);
        return;
      }

      // Simple validation for positive numbers
      const amountOffered = parseFloat(formData.amountOffered);
      const amountRequested = parseFloat(formData.amountRequested);
      
      if (isNaN(amountOffered) || amountOffered <= 0) {
        setStep('error', "Please enter a valid offered amount");
        return;
      }
      
      if (isNaN(amountRequested) || amountRequested <= 0) {
        setStep('error', "Please enter a valid requested amount");
        return;
      }

      // Enhanced expiry validation
      const expiryDays = parseInt(formData.expiryDays);
      if (isNaN(expiryDays) || expiryDays < 1 || expiryDays > 365) {
        setStep('error', "Expiry days must be between 1 and 365");
        return;
      }

      setStep('creating_db');

      // Generate unique deal ID using actual wallet address
      const walletAddress = publicKey.toString();
      const dealId = generateUniqueDealId(walletAddress);
      
      // Validate the generated deal ID
      if (isNaN(dealId) || dealId <= 0) {
        console.error("Invalid deal ID generated:", dealId);
        setStep('error', "Failed to generate valid deal ID. Please try again.");
        return;
      }

      // Enhanced expiry timestamp calculation with buffer
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const bufferSeconds = 60; // 1 minute buffer to account for transaction time
      const expiryTimestamp = currentTimestamp + bufferSeconds + (expiryDays * 24 * 60 * 60);
      
      console.log("Timestamp validation:");
      console.log("Current timestamp:", currentTimestamp);
      console.log("Expiry timestamp:", expiryTimestamp);
      console.log("Time difference (hours):", (expiryTimestamp - currentTimestamp) / 3600);
      
      // Additional validation before submitting
      if (expiryTimestamp <= currentTimestamp) {
        setStep('error', "Expiry time must be in the future");
        return;
      }
      
      // Convert amounts to base units (9 decimal places for most SPL tokens)
      const amountOfferedInBaseUnits = Math.floor(amountOffered * 1e9);
      const amountRequestedInBaseUnits = Math.floor(amountRequested * 1e9);
      
      console.log("Creating deal with ID:", dealId, "for wallet:", walletAddress);
      console.log("Amounts - Offered:", amountOfferedInBaseUnits, "Requested:", amountRequestedInBaseUnits);

      setStep('submitting_tx');

      const result = await createDeal({
        dealId,
        tokenMintOffered: formData.tokenMintOffered,
        amountOffered: amountOfferedInBaseUnits,
        tokenMintRequested: formData.tokenMintRequested,
        amountRequested: amountRequestedInBaseUnits,
        expiryTimestamp,
      });

      if (result.success) {
        setStep('complete', undefined, result.signature);
        
        // Auto-navigate after successful creation
        setTimeout(() => {
          navigate('/deals');
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to create deal:', error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setStep('error', errorMessage);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Reset transaction state when form changes
    if (txState.step !== 'idle') {
      reset();
    }
  };

  const getStepMessage = () => {
    switch (txState.step) {
      case 'validating': return 'Validating deal parameters...';
      case 'creating_db': return 'Preparing blockchain transaction...';
      case 'submitting_tx': return 'Submitting to blockchain...';
      case 'confirming': return 'Confirming transaction...';
      case 'complete': return 'Deal created successfully!';
      case 'error': return txState.error || 'An error occurred';
      default: return '';
    }
  };

  const getStepIcon = () => {
    switch (txState.step) {
      case 'complete': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Loader2 className="w-4 h-4 animate-spin" />;
    }
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
              disabled={txState.isLoading}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Create OTC Deal</h1>
              <p className="text-muted-foreground">Set up a new over-the-counter trade</p>
            </div>
          </div>

          {/* Transaction Status */}
          {txState.step !== 'idle' && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {getStepIcon()}
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      txState.step === 'complete' ? 'text-green-700' :
                      txState.step === 'error' ? 'text-red-700' : 
                      'text-blue-700'
                    }`}>
                      {getStepMessage()}
                    </p>
                    {txState.signature && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Signature: {txState.signature.slice(0, 20)}...
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                        disabled={txState.isLoading}
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
                        disabled={txState.isLoading}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter any amount for OTC trading
                      </p>
                    </div>
                  </div>
                </div>

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
                        disabled={txState.isLoading}
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
                        disabled={txState.isLoading}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter any amount for OTC trading
                      </p>
                    </div>
                  </div>
                </div>

                {/* Enhanced Expiry Section */}
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
                      max="365"
                      value={formData.expiryDays}
                      onChange={(e) => handleInputChange('expiryDays', e.target.value)}
                      disabled={txState.isLoading}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Deal will expire in {formData.expiryDays} day(s) (between 1 and 365 days allowed)
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
                  disabled={txState.isLoading || !isAuthenticated}
                  className="w-full"
                >
                  {txState.isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {getStepMessage()}
                    </>
                  ) : (
                    'Create Deal'
                  )}
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
