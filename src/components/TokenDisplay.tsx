import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getTokenByMint } from '@/contracts/tokens';

interface TokenDisplayProps {
  mintAddress: string;
  amount: string;
  name?: string;
  symbol?: string;
  image?: string;
  showAmount?: boolean;
  className?: string;
}

export const TokenDisplay = ({ 
  mintAddress, 
  amount, 
  name, 
  symbol, 
  image,
  showAmount = true,
  className = ""
}: TokenDisplayProps) => {
  // Fallback to hardcoded tokens if metadata not available
  const fallbackToken = getTokenByMint(mintAddress);
  
  const displayName = name || fallbackToken?.name || `Token ${mintAddress.slice(0, 8)}...`;
  const displaySymbol = symbol || fallbackToken?.symbol || `${mintAddress.slice(0, 4)}...`;
  const displayImage = image || undefined;

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        {displayImage && (
          <AvatarImage src={displayImage} alt={displaySymbol} />
        )}
        <AvatarFallback className="text-xs bg-muted">
          {displaySymbol.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-sm truncate">{displaySymbol}</span>
          {showAmount && (
            <span className="text-sm text-muted-foreground">{amount}</span>
          )}
        </div>
        <span className="text-xs text-muted-foreground truncate">{displayName}</span>
      </div>
    </div>
  );
};