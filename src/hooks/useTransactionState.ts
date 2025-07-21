
import { useState, useCallback } from 'react';

export interface TransactionState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  signature: string | null;
  step: 'idle' | 'validating' | 'creating_accounts' | 'wrapping_sol' | 'submitting_tx' | 'confirming' | 'updating_db' | 'complete' | 'error';
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

  const getStepMessage = useCallback((step: TransactionState['step']) => {
    switch (step) {
      case 'validating':
        return 'Validating transaction...';
      case 'creating_accounts':
        return 'Creating token accounts...';
      case 'wrapping_sol':
        return 'Wrapping SOL...';
      case 'submitting_tx':
        return 'Submitting transaction...';
      case 'confirming':
        return 'Confirming transaction...';
      case 'updating_db':
        return 'Updating database...';
      case 'complete':
        return 'Transaction completed successfully!';
      case 'error':
        return 'Transaction failed';
      default:
        return '';
    }
  }, []);

  return {
    state,
    setStep,
    reset,
    getStepMessage
  };
};
