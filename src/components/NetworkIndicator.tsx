import React from 'react';
import { Badge } from '@/components/ui/badge';

export const NetworkIndicator: React.FC = () => {
  return (
    <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
      Devnet
    </Badge>
  );
};

export default NetworkIndicator;