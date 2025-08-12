import { useState } from 'react';
import { TokenMetadata } from '@/services/tokenMetadata';
import { getTokenByMint } from '@/contracts/tokens';
import { Skeleton } from '@/components/ui/skeleton';

interface TokenDisplayProps {
  mintAddress: string;
  metadata?: TokenMetadata | null;
  loading?: boolean;
  showFullName?: boolean;
  showImage?: boolean;
  imageSize?: 'sm' | 'md' | 'lg';
  className?: string;
  // Stored metadata from database (higher priority)
  storedSymbol?: string;
  storedName?: string;
  storedImage?: string;
}

const TokenDisplay = ({
  mintAddress,
  metadata,
  loading = false,
  showFullName = false,
  showImage = true,
  imageSize = 'sm',
  className = '',
  storedSymbol,
  storedName,
  storedImage,
}: TokenDisplayProps) => {
  const [imageError, setImageError] = useState(false);
  
  // Fallback to static token registry
  const staticToken = getTokenByMint(mintAddress);
  
  // Priority: stored metadata > fetched metadata > static token > fallback
  const displayData = {
    symbol: storedSymbol || metadata?.symbol || staticToken?.symbol || `${mintAddress.slice(0, 4)}...${mintAddress.slice(-4)}`,
    name: storedName || metadata?.name || staticToken?.name || 'Unknown Token',
    logoURI: storedImage || metadata?.logoURI || undefined,
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const imageSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showImage && (
          <Skeleton className={`rounded-full ${imageSizeClasses[imageSize]}`} />
        )}
        <div className="space-y-1">
          <Skeleton className="h-4 w-16" />
          {showFullName && <Skeleton className="h-3 w-24" />}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showImage && displayData.logoURI && !imageError && (
        <img
          src={displayData.logoURI}
          alt={`${displayData.symbol} logo`}
          className={`rounded-full ${imageSizeClasses[imageSize]} object-cover`}
          onError={() => setImageError(true)}
        />
      )}
      {showImage && (!displayData.logoURI || imageError) && (
        <div className={`${imageSizeClasses[imageSize]} rounded-full bg-muted flex items-center justify-center`}>
          <span className="text-xs font-medium text-muted-foreground">
            {displayData.symbol.slice(0, 2).toUpperCase()}
          </span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="font-medium truncate">{displayData.symbol}</div>
        {showFullName && (
          <div className="text-xs text-muted-foreground truncate">
            {displayData.name}
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenDisplay;