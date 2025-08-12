import { useState, useEffect } from 'react';
import { tokenMetadataService, TokenMetadata } from '@/services/tokenMetadata';

export const useTokenMetadata = (mintAddresses: string[]) => {
  const [metadata, setMetadata] = useState<Map<string, TokenMetadata>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mintAddresses.length === 0) return;

    const fetchMetadata = async () => {
      setLoading(true);
      setError(null);

      try {
        const results = await tokenMetadataService.getMultipleTokenMetadata(mintAddresses);
        setMetadata(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch token metadata');
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [mintAddresses.join(',')]);

  return { metadata, loading, error };
};

export const useSingleTokenMetadata = (mintAddress: string) => {
  const [metadata, setMetadata] = useState<TokenMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mintAddress) return;

    const fetchMetadata = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await tokenMetadataService.getTokenMetadata(mintAddress);
        setMetadata(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch token metadata');
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [mintAddress]);

  return { metadata, loading, error };
};