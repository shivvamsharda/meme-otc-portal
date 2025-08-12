import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useTokenBackfill = () => {
  const [isBackfilling, setIsBackfilling] = useState(false);

  const backfillTokenMetadata = async (): Promise<boolean> => {
    if (isBackfilling) return false;
    
    setIsBackfilling(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('backfill-token-metadata', {
        body: {}
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.success) {
        toast({
          title: "Metadata Update Complete",
          description: `Successfully updated ${data.tokensProcessed} tokens across ${data.dealsUpdated} deals`,
          className: "border-green-200 bg-green-50 text-green-900",
        });
        return true;
      } else {
        throw new Error(data?.error || 'Failed to backfill metadata');
      }
    } catch (error) {
      console.error('Backfill error:', error);
      toast({
        title: "Metadata Update Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsBackfilling(false);
    }
  };

  return {
    backfillTokenMetadata,
    isBackfilling
  };
};