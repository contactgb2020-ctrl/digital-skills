// Supabase Edge Function: create-flutterwave-checkout
//
// STATUS: SCAFFOLD ONLY — not active yet. Same pattern as
// create-paystack-checkout: mirrors create-checkout-session (Stripe) so
// the frontend can offer a choice of payment providers with minimal
// changes once Flutterwave is ready.
//
// Flutterwave supports cards, bank transfers, and mobile money across
// most African countries — a strong complement to Stripe (international
// cards) for local payment methods.
//
// To activate once you have your Flutterwave secret key:
//   1. supabase secrets set FLUTTERWAVE_SECRET_KEY=FLWSECK_...
//   2. Uncomment the implementation below
//   3. Deploy: supabase functions deploy create-flutterwave-checkout
//   4. Add a matching flutterwave-webhook function (same pattern as
//      stripe-webhook/index.ts) to activate subscriptions automatically —
//      Flutterwave calls it a "webhook" too, listening for
//      "charge.completed" with status "successful"
//   5. In StudentDashboard.tsx, add this as another payment option
//      alongside Stripe / manual payment

import { createClient } from 'npm:@supabase/supabase-js@2';

const PLAN_PRICES_USD: Record<string, number> = {
  starter: 189,
  professional: 249,
  expert: 290,
  bundle: 499,
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const flwKey = Deno.env.get('FLUTTERWAVE_SECRET_KEY');
  if (!flwKey) {
    return new Response(JSON.stringify({
      error: 'Flutterwave is not connected yet. This endpoint is a placeholder — see the comments in this file to activate it once your Flutterwave account is ready.',
    }), { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // ---- Implementation to uncomment once FLUTTERWAVE_SECRET_KEY is set ----
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
  // const amount = PLAN_PRICES_USD[plan];
  // if (!amount) {
  //   return new Response(JSON.stringify({ error: 'Unknown plan.' }), {
  //     status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  //   });
  // }
  //
  // const origin = req.headers.get('Origin') || 'https://digital-skills.pages.dev';
  // const txRef = `ds-${userData.user.id}-${Date.now()}`;
  //
  // // Flutterwave "Standard" payment initiation:
  // // https://developer.flutterwave.com/docs/standard
  // const resp = await fetch('https://api.flutterwave.com/v3/payments', {
  //   method: 'POST',
  //   headers: {
  //     Authorization: `Bearer ${flwKey}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     tx_ref: txRef,
  //     amount,
  //     currency: 'USD',
  //     redirect_url: `${origin}/dashboard?payment=success`,
  //     customer: { email: userData.user.email },
  //     meta: { user_id: userData.user.id, plan },
  //     customizations: { title: 'Digital Skills', description: `Plan ${plan}` },
  //   }),
  // });
  // const data = await resp.json();
  // return new Response(JSON.stringify({ url: data.data?.link }), {
  //   headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  // });

  return new Response(JSON.stringify({ error: 'Not implemented yet.' }), {
    status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
