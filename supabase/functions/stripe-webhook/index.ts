// Supabase Edge Function: stripe-webhook
//
// Receives Stripe's payment confirmation and activates the student's
// subscription automatically — no manual admin confirmation needed once
// this is live. Reuses the exact same "activate subscription" logic that
// the admin's manual-payment confirmation already uses.
//
// Required secrets:
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SECRET      - from your Stripe Dashboard webhook settings
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// After deploying, register this function's URL as a webhook endpoint in
// your Stripe Dashboard, listening for the "checkout.session.completed" event.
//
// Deploy with: supabase functions deploy stripe-webhook --no-verify-jwt
// (--no-verify-jwt is required: Stripe calls this endpoint directly, not
// through a logged-in user, so Supabase's default JWT check must be off.
// The Stripe signature check below is what actually secures this endpoint.)

import Stripe from 'npm:stripe@17';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!stripeKey || !webhookSecret) {
    return new Response('Stripe is not configured yet.', { status: 500 });
  }
  const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });

  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, webhookSecret);
  } catch (err) {
    return new Response(`Webhook signature verification failed: ${(err as Error).message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const plan = session.metadata?.plan;

    if (userId && plan) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );

      // Find this user's most recent subscription (created as
      // 'pending_payment' at signup) and activate it for one year.
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);

      let subscriptionId: string | null = null;
      if (sub) {
        await supabase.from('subscriptions')
          .update({ status: 'active', plan, end_date: endDate.toISOString() })
          .eq('id', sub.id);
        subscriptionId = sub.id;
      } else {
        const { data: newSub } = await supabase.from('subscriptions').insert({
          user_id: userId, plan, status: 'active',
          start_date: new Date().toISOString(), end_date: endDate.toISOString(),
        }).select().single();
        subscriptionId = newSub?.id ?? null;
      }

      await supabase.from('payments').insert({
        user_id: userId,
        subscription_id: subscriptionId,
        provider: 'stripe',
        amount: (session.amount_total ?? 0) / 100,
        currency: (session.currency ?? 'usd').toUpperCase(),
        status: 'completed',
        reference: session.id,
      });
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
