// Supabase Edge Function: create-paystack-checkout
//
// STATUS: SCAFFOLD ONLY — not active yet. Paystack account/API keys are
// pending validation. This mirrors the exact same interface as
// create-checkout-session (Stripe) so the frontend can switch between
// providers with minimal changes once Paystack is ready.
//
// To activate once you have your Paystack secret key:
//   1. supabase secrets set PAYSTACK_SECRET_KEY=sk_...
//   2. Uncomment the implementation below
//   3. Deploy: supabase functions deploy create-paystack-checkout
//   4. Add a matching paystack-webhook function (same pattern as
//      stripe-webhook/index.ts) to activate subscriptions automatically —
//      Paystack calls it "Initialize Transaction" + webhook "charge.success"
//   5. In StudentDashboard.tsx, add a payment-provider choice (Card via
//      Stripe / Mobile Money via Paystack) that calls the matching function

import { createClient } from 'npm:@supabase/supabase-js@2';

const PLAN_PRICES_CENTS: Record<string, number> = {
  starter: 18900,
  professional: 24900,
  expert: 29000,
  bundle: 49900,
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const paystackKey = Deno.env.get('PAYSTACK_SECRET_KEY');
  if (!paystackKey) {
    return new Response(JSON.stringify({
      error: 'Paystack is not connected yet. This endpoint is a placeholder — see the comments in this file to activate it once your Paystack account is validated.',
    }), { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // ---- Implementation to uncomment once PAYSTACK_SECRET_KEY is set ----
  //
  // const authHeader = req.headers.get('Authorization');
  // if (!authHeader) {
  //   return new Response(JSON.stringify({ error: 'Not authenticated.' }), {
  //     status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  //   });
  // }
  // const supabase = createClient(
  //   Deno.env.get('SUPABASE_URL')!,
  //   Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  // );
  // const { data: userData } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  // if (!userData?.user) {
  //   return new Response(JSON.stringify({ error: 'Not authenticated.' }), {
  //     status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  //   });
  // }
  //
  // const { plan } = await req.json();
  // const amountCents = PLAN_PRICES_CENTS[plan];
  // if (!amountCents) {
  //   return new Response(JSON.stringify({ error: 'Unknown plan.' }), {
  //     status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  //   });
  // }
  //
  // const origin = req.headers.get('Origin') || 'https://digital-skills.pages.dev';
  //
  // // Paystack "Initialize Transaction": https://api.paystack.co/transaction/initialize
  // const resp = await fetch('https://api.paystack.co/transaction/initialize', {
  //   method: 'POST',
  //   headers: {
  //     Authorization: `Bearer ${paystackKey}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     email: userData.user.email,
  //     amount: amountCents, // Paystack expects the smallest currency unit
  //     currency: 'USD',
  //     metadata: { user_id: userData.user.id, plan },
  //     callback_url: `${origin}/dashboard?payment=success`,
  //   }),
  // });
  // const data = await resp.json();
  // return new Response(JSON.stringify({ url: data.data?.authorization_url }), {
  //   headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  // });

  return new Response(JSON.stringify({ error: 'Not implemented yet.' }), {
    status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
