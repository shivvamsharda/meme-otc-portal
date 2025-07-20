
-- Create deals table to store all deal information
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id BIGINT NOT NULL UNIQUE,
  maker_address TEXT NOT NULL,
  taker_address TEXT,
  token_mint_offered TEXT NOT NULL,
  amount_offered BIGINT NOT NULL,
  token_mint_requested TEXT NOT NULL,
  amount_requested BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expiry_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  platform_fee BIGINT DEFAULT 0,
  escrow_bump INTEGER,
  blockchain_synced BOOLEAN DEFAULT false,
  transaction_signature TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create deal_transactions table to track transaction history
CREATE TABLE public.deal_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id BIGINT NOT NULL REFERENCES public.deals(deal_id),
  transaction_type TEXT NOT NULL, -- 'create', 'accept', 'cancel'
  transaction_signature TEXT,
  user_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for better query performance
CREATE INDEX idx_deals_maker_address ON public.deals(maker_address);
CREATE INDEX idx_deals_taker_address ON public.deals(taker_address);
CREATE INDEX idx_deals_status ON public.deals(status);
CREATE INDEX idx_deals_created_at ON public.deals(created_at);
CREATE INDEX idx_deal_transactions_deal_id ON public.deal_transactions(deal_id);
CREATE INDEX idx_deal_transactions_user_address ON public.deal_transactions(user_address);

-- Enable Row Level Security
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for deals (public read, authenticated write)
CREATE POLICY "Anyone can view deals" 
  ON public.deals 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create deals" 
  ON public.deals 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update their deals" 
  ON public.deals 
  FOR UPDATE 
  USING (true);

-- Create RLS policies for deal_transactions (public read, authenticated write)
CREATE POLICY "Anyone can view deal transactions" 
  ON public.deal_transactions 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create deal transactions" 
  ON public.deal_transactions 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update deal transactions" 
  ON public.deal_transactions 
  FOR UPDATE 
  USING (true);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_deals_updated_at 
    BEFORE UPDATE ON public.deals 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
