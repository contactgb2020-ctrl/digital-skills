-- Critical fix: the pricing page offers 4 plans (starter, professional,
-- expert, bundle) but this constraint only allowed ('starter','premium',
-- 'enterprise'). Signing up for professional/expert/bundle was silently
-- failing at the database level. Align the constraint with the real plans.
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('starter', 'professional', 'expert', 'bundle'));
