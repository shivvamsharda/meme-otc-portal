import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@solana/wallet-adapter-react';

interface DatabaseDeal {
  id: string;
  deal_id: number;
  maker_address: string;
  taker_address: string | null;
  token_mint_offered: string;
  amount_offered: number;
  amount_offered_display: number;
  token_offered_name: string | null;
  token_offered_symbol: string | null;
  token_offered_image: string | null;
  token_mint_requested: string;
  amount_requested: number;
  amount_requested_display: number;
  token_requested_name: string | null;
  token_requested_symbol: string | null;
  token_requested_image: string | null;
  status: string;
  created_at: string;
  expiry_timestamp: string;
  completed_at: string | null;
  platform_fee: number;
  escrow_bump: number | null;
  blockchain_synced: boolean;
  transaction_signature: string | null;
  updated_at: string;
}

interface DatabaseTransaction {
  id: string;
  deal_id: number;
  transaction_type: 'create' | 'accept' | 'cancel';
  transaction_signature: string | null;
  user_address: string;
  status: 'pending' | 'confirmed' | 'failed';
  error_message: string | null;
  created_at: string;
  confirmed_at: string | null;
}

export const useDatabase = () => {
  const { publicKey } = useWallet();

  const createDeal = async (dealData: {
    dealId: number;
    makerAddress: string;
    tokenMintOffered: string;
    amountOffered: number;
    amountOfferedDisplay: number;
    tokenOfferedName?: string;
    tokenOfferedSymbol?: string;
    tokenOfferedImage?: string;
    tokenMintRequested: string;
    amountRequested: number;
    amountRequestedDisplay: number;
    tokenRequestedName?: string;
    tokenRequestedSymbol?: string;
    tokenRequestedImage?: string;
    expiryTimestamp: number;
    platformFee?: number;
  }) => {
    const { data, error } = await supabase
      .from('deals')
      .insert({
        deal_id: dealData.dealId,
        maker_address: dealData.makerAddress,
        token_mint_offered: dealData.tokenMintOffered,
        amount_offered: dealData.amountOffered,
        amount_offered_display: dealData.amountOfferedDisplay,
        token_offered_name: dealData.tokenOfferedName,
        token_offered_symbol: dealData.tokenOfferedSymbol,
        token_offered_image: dealData.tokenOfferedImage,
        token_mint_requested: dealData.tokenMintRequested,
        amount_requested: dealData.amountRequested,
        amount_requested_display: dealData.amountRequestedDisplay,
        token_requested_name: dealData.tokenRequestedName,
        token_requested_symbol: dealData.tokenRequestedSymbol,
        token_requested_image: dealData.tokenRequestedImage,
        expiry_timestamp: new Date(dealData.expiryTimestamp * 1000).toISOString(),
        platform_fee: dealData.platformFee || 0,
        status: 'Open'
      })
      .select()
      .single();

    if (error) {
      // If unique constraint violation, return existing deal
      if (error.code === '23505' && error.message?.includes('deals_deal_id_unique')) {
        console.log('Deal already exists, fetching existing deal');
        const existingDeal = await getDealById(dealData.dealId);
        if (existingDeal) return existingDeal;
      }
      throw error;
    }
    return data;
  };

  const deleteDeal = async (dealId: number) => {
    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('deal_id', dealId);

    if (error) throw error;
  };

  const updateDealStatus = async (dealId: number, status: string, updates: Partial<DatabaseDeal> = {}) => {
    const { data, error } = await supabase
      .from('deals')
      .update({ status, ...updates })
      .eq('deal_id', dealId)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateDealWithTransaction = async (dealId: number, signature: string, synced: boolean = true) => {
    const { data, error } = await supabase
      .from('deals')
      .update({ 
        transaction_signature: signature,
        blockchain_synced: synced 
      })
      .eq('deal_id', dealId)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const logTransaction = async (transactionData: {
    dealId: number;
    transactionType: 'create' | 'accept' | 'cancel';
    userAddress: string;
    transactionSignature?: string;
    status?: 'pending' | 'confirmed' | 'failed';
    errorMessage?: string;
  }) => {
    const { data, error } = await supabase
      .from('deal_transactions')
      .insert({
        deal_id: transactionData.dealId,
        transaction_type: transactionData.transactionType,
        user_address: transactionData.userAddress,
        transaction_signature: transactionData.transactionSignature,
        status: transactionData.status || 'pending',
        error_message: transactionData.errorMessage
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateTransactionStatus = async (
    dealId: number, 
    transactionType: 'create' | 'accept' | 'cancel',
    status: 'pending' | 'confirmed' | 'failed',
    signature?: string,
    errorMessage?: string
  ) => {
    const updates: any = { status };
    if (signature) updates.transaction_signature = signature;
    if (errorMessage) updates.error_message = errorMessage;
    if (status === 'confirmed') updates.confirmed_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('deal_transactions')
      .update(updates)
      .eq('deal_id', dealId)
      .eq('transaction_type', transactionType)
      .order('created_at', { ascending: false })
      .limit(1)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const getDeals = async (openOnly: boolean = false): Promise<DatabaseDeal[]> => {
    let query = supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false });

    if (openOnly) {
      query = query.eq('status', 'Open');
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };

  const getMyDeals = async (): Promise<DatabaseDeal[]> => {
    if (!publicKey) return [];

    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .or(`maker_address.eq.${publicKey.toString()},taker_address.eq.${publicKey.toString()}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const getDealById = async (dealId: number): Promise<DatabaseDeal | null> => {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('deal_id', dealId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching deal by ID:', error);
      return null;
    }
    return data;
  };

  const getDealTransactions = async (dealId: number): Promise<DatabaseTransaction[]> => {
    const { data, error } = await supabase
      .from('deal_transactions')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  return {
    createDeal,
    deleteDeal,
    updateDealStatus,
    updateDealWithTransaction,
    logTransaction,
    updateTransactionStatus,
    getDeals,
    getMyDeals,
    getDealById,
    getDealTransactions,
  };
};
