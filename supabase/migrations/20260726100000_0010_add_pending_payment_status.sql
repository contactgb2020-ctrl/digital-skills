-- Remove the free trial: students now choose a plan and must pay before
-- getting full access. New subscriptions start as 'pending_payment' until
-- an admin confirms the manual payment (Paystack/CinetPay not yet live),
-- at which point they become 'active'.
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('trial', 'pending_payment', 'active', 'expired', 'cancelled'));
