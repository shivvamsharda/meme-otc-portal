-- Add display amount columns to deals table
ALTER TABLE public.deals 
ADD COLUMN amount_offered_display DECIMAL,
ADD COLUMN amount_requested_display DECIMAL;

-- Update existing deals with calculated display amounts (assuming 9 decimals for SOL and offered tokens as fallback)
UPDATE public.deals 
SET 
  amount_offered_display = amount_offered / 1000000000.0,
  amount_requested_display = amount_requested / 1000000000.0
WHERE amount_offered_display IS NULL;