import React from 'react';
import TokenDisplay from './TokenDisplay';
import { useSingleTokenMetadata } from '@/hooks/useTokenMetadata';

interface TokenAmountDisplayProps {
  amount: number;
  mintAddress: string;
  className?: string;
  showFullName?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const TokenAmountDisplay: React.FC<TokenAmountDisplayProps> = ({
  amount,
  mintAddress,
  className = '',
  showFullName = false,
  size = 'md'
}) => {
  const { metadata, loading } = useSingleTokenMetadata(mintAddress);
  
  const formatTokenAmount = (amount: number, decimals: number = 9) => {
    const divisor = Math.pow(10, decimals);
    const formatted = (amount / divisor).toFixed(decimals);
    // Remove trailing zeros
    return parseFloat(formatted).toString();
  };

  const decimals = metadata?.decimals || 9; // Default to 9 decimals if not available
  const formattedAmount = formatTokenAmount(amount, decimals);
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg font-semibold',
    lg: 'text-2xl font-bold'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={sizeClasses[size]}>
        {formattedAmount}
      </span>
      <TokenDisplay 
        mintAddress={mintAddress}
        metadata={metadata || undefined}
        loading={loading}
        showFullName={showFullName}
        imageSize={size}
      />
    </div>
  );
};

export default TokenAmountDisplay;