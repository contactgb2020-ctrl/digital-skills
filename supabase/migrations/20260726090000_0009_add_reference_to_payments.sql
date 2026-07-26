-- Add a reference/note field to payments so students can submit a manual
-- transfer reference (Mobile Money, bank transfer, etc.) while Paystack and
-- Cinetpay are not yet validated. Admins use this to match and confirm
-- manual payments before activating the subscription.
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reference text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS note text;
