
import { useState, useCallback } from 'react';

export interface TransactionState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  signature: string | null;
  step: 'idle' | 'validating' | 'creating_db' | 'submitting_tx' | 'confirming' | 'complete' | 'error';
}

export const useTransactionState = () => {
  const [state, setState] = useState<TransactionState>({
    isLoading: false,
    error: null,
    success: false,
    signature: null,
    step: 'idle'
  });

  const setStep = useCallback((step: TransactionState['step'], error?: string, signature?: string) => {
    setState(prev => ({
      ...prev,
      step,
      isLoading: step !== 'complete' && step !== 'error' && step !== 'idle',
      error: error || (step === 'error' ? prev.error : null),
      success: step === 'complete',
      signature: signature || prev.signature
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      success: false,
      signature: null,
      step: 'idle'
    });
  }, []);

  return {
    state,
    setStep,
    reset
  };
};
