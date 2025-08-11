import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Subscribes to realtime changes on the `deals` table and triggers the provided callback
export const useRealtimeDeals = (onChange: () => void) => {
  useEffect(() => {
    const channel = supabase
      .channel('public:deals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, () => {
        try {
          onChange();
        } catch (e) {
          console.warn('Realtime refresh failed:', e);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onChange]);
};
