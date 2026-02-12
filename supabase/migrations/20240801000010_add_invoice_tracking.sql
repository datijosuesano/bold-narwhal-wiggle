-- Add invoice tracking columns to work_orders
ALTER TABLE public.work_orders 
ADD COLUMN IF NOT EXISTS parts_replaced BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS invoice_status TEXT DEFAULT 'None'; -- 'None', 'Deposited', 'Paid'

-- Update existing records to ensure consistency
UPDATE public.work_orders SET invoice_status = 'None' WHERE invoice_status IS NULL;
UPDATE public.work_orders SET parts_replaced = FALSE WHERE parts_replaced IS NULL;