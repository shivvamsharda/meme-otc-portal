-- Enable complete row images for realtime
ALTER TABLE public.deals REPLICA IDENTITY FULL;
ALTER TABLE public.deal_transactions REPLICA IDENTITY FULL;

-- Ensure tables are included in the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deal_transactions;

-- Update updated_at automatically on UPDATEs
DROP TRIGGER IF EXISTS set_deals_updated_at ON public.deals;
CREATE TRIGGER set_deals_updated_at
BEFORE UPDATE ON public.deals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_deal_transactions_updated_at ON public.deal_transactions;
CREATE TRIGGER set_deal_transactions_updated_at
BEFORE UPDATE ON public.deal_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();