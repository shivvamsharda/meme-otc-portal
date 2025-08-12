
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContract } from '@/contracts/useContract';
import { toast } from '@/hooks/use-toast';
import { useTransactionState } from '@/hooks/useTransactionState';
import { generateUniqueDealId, validateDealParams, decimalToBaseUnits } from '@/utils/dealUtils';
import { getTokenBySymbol } from '@/contracts/tokens';
import { tokenMetadataService } from '@/services/tokenMetadata';
import { ArrowLeft, Coins, Calendar, DollarSign, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';

const CreateDeal = () => {
  const navigate = useNavigate();
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { createDeal, isAuthenticated } = useContract();
  const { state: txState, setStep, reset } = useTransactionState();
  const [formData, setFormData] = useState({
    tokenMintOffered: '',
    amountOffered: '',
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
      // Hardcode SOL as the only payment token
      const requestedTokenData = getTokenBySymbol('SOL');
      if (!requestedTokenData) {
        setStep('error', "SOL payment token not configured");
        return;
      }

      // Validate form data
      const validationParams = {
        tokenMintOffered: formData.tokenMintOffered,
        amountOffered: formData.amountOffered,
        tokenMintRequested: requestedTokenData.mint,
        amountRequested: formData.amountRequested,
        expiryDays: formData.expiryDays
      };

      const validationError = validateDealParams(validationParams);
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

      setStep('updating_db');

      // Fetch token metadata for both offered and requested tokens
      const [offeredTokenMetadata, requestedTokenMetadata] = await Promise.all([
        tokenMetadataService.getTokenMetadata(formData.tokenMintOffered),
        Promise.resolve({
          symbol: requestedTokenData.symbol,
          name: requestedTokenData.name,
          logoURI: undefined
        })
      ]);

      console.log('Fetched token metadata:', {
        offered: offeredTokenMetadata,
        requested: requestedTokenMetadata
      });

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
      
      // Get token mint info to determine correct decimals for offered token
      let offeredTokenDecimals = 9; // Default fallback
      try {
        const tokenMintInfo = await connection.getAccountInfo(new PublicKey(formData.tokenMintOffered));
        if (tokenMintInfo && tokenMintInfo.data.length >= 45) {
          // Parse mint data to get decimals (bytes 44-45 contain decimals)
          offeredTokenDecimals = tokenMintInfo.data[44];
          console.log(`Offered token decimals: ${offeredTokenDecimals}`);
        } else {
          console.warn("Could not fetch token mint info, using default 9 decimals");
        }
      } catch (error) {
        console.warn("Error fetching token mint info, using default 9 decimals:", error);
      }
      
// Convert amounts to base units using safe string math
const amountOfferedInBaseUnits = decimalToBaseUnits(formData.amountOffered, offeredTokenDecimals);
// Use actual decimals for requested token (e.g., SOL has 9)
const amountRequestedInBaseUnits = decimalToBaseUnits(formData.amountRequested, requestedTokenData.decimals);

console.log("Creating deal with ID:", dealId, "for wallet:", walletAddress);
console.log("Decimals - Offered token:", offeredTokenDecimals, "Requested token:", requestedTokenData.decimals);
console.log("Amounts (base units) - Offered:", amountOfferedInBaseUnits, "Requested:", amountRequestedInBaseUnits);
console.log("Requested token:", requestedTokenData.symbol, "with mint:", requestedTokenData.mint);

      // price-per-token validation removed for flexible pricing

      setStep('submitting_tx');

      const result = await createDeal({
        tokenMint: formData.tokenMintOffered,
        tokenAmount: amountOfferedInBaseUnits,
        totalPrice: amountRequestedInBaseUnits,
        durationHours: expiryDays * 24,
        listingNonce: Date.now(),
        // Pass display amounts for database storage
        amountOfferedDisplay: amountOffered,
        amountRequestedDisplay: amountRequested,
        // Pass token metadata for database storage
        tokenOfferedName: offeredTokenMetadata?.name,
        tokenOfferedSymbol: offeredTokenMetadata?.symbol,
        tokenOfferedImage: offeredTokenMetadata?.logoURI,
        tokenRequestedName: requestedTokenMetadata.name,
        tokenRequestedSymbol: requestedTokenMetadata.symbol,
        tokenRequestedImage: requestedTokenMetadata.logoURI,
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
      case 'updating_db': return 'Preparing blockchain transaction...';
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
                Sell any token and accept SOL as payment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Token Offered Section - Manual Input */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Token You're Selling
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="tokenMintOffered">Token Mint Address</Label>
                      <Input
                        id="tokenMintOffered"
                        placeholder="Enter token mint address (e.g., 8m38bz481d1du6KD7nhzMfejg31khNDJmTEz1GP7bfpG)"
                        value={formData.tokenMintOffered}
                        onChange={(e) => handleInputChange('tokenMintOffered', e.target.value)}
                        disabled={txState.isLoading}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter the mint address of any Solana token/memecoin you want to sell
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="amountOffered">Amount You're Selling</Label>
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
                    </div>
                  </div>
                </div>

                {/* Token Requested Section - SOL Only */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Coins className="w-4 h-4" />
                    What You Want in Return
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="paymentToken">Payment Token</Label>
                      <div className="px-4 py-2 bg-muted border border-input rounded-md text-foreground text-sm flex items-center justify-between">
                        <span className="font-medium">SOL</span>
                        <span className="text-sm text-muted-foreground">Solana</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        All deals use SOL as payment
                      </p>
                    </div>
                    
<div className="space-y-2">
  <Label htmlFor="amountRequested">Amount You Want (SOL)</Label>
  <div className="flex">
    <Input
      id="amountRequested"
      type="number"
      step="0.000001"
      placeholder="0.0"
      value={formData.amountRequested}
      onChange={(e) => handleInputChange('amountRequested', e.target.value)}
      disabled={txState.isLoading}
      required
      className="rounded-r-none"
    />
    <div className="px-4 py-2 bg-muted border border-input border-l-0 rounded-r-md text-muted-foreground text-sm flex items-center min-w-[80px]">
      SOL
    </div>
  </div>
  <p className="text-xs text-muted-foreground">Preview: List {formData.amountOffered || '0'} tokens for {formData.amountRequested || '0'} SOL</p>
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
