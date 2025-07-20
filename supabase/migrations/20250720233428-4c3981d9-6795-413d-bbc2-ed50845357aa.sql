
-- Add unique constraint on deal_id to prevent duplicates
ALTER TABLE public.deals ADD CONSTRAINT deals_deal_id_unique UNIQUE (deal_id);

-- Clean up any existing duplicate deals (keep the first one created)
DELETE FROM public.deals 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM public.deals 
  GROUP BY deal_id
);

-- Also clean up orphaned transactions for deleted deals
DELETE FROM public.deal_transactions 
WHERE deal_id NOT IN (
  SELECT deal_id FROM public.deals
);
