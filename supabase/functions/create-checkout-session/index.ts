// Supabase Edge Function: create-checkout-session
//
// Called from the frontend when a student clicks "Payer par carte".
// Creates a Stripe Checkout Session and returns its URL for redirect.
//
// Required secrets (set with `supabase secrets set NAME=value`, never in code):
//   STRIPE_SECRET_KEY        - your Stripe secret key (sk_live_... or sk_test_...)
//   SUPABASE_URL             - auto-provided by Supabase
//   SUPABASE_SERVICE_ROLE_KEY - service role key, used only to read the caller's plan safely
//
// Deploy with: supabase functions deploy create-checkout-session

import Stripe from 'npm:stripe@17';
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

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: 'Stripe is not configured yet.' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });

    // Verify the caller's identity from their auth token — never trust a
    // user_id passed in the request body.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Not authenticated.' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Not authenticated.' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = userData.user.id;
    const userEmail = userData.user.email;

    const { plan } = await req.json();
    const amountCents = PLAN_PRICES_CENTS[plan];
    if (!amountCents) {
      return new Response(JSON.stringify({ error: 'Unknown plan.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const origin = req.headers.get('Origin') || 'https://digital-skills.pages.dev';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: userEmail,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Digital Skills — Plan ${plan}` },
          unit_amount: amountCents,
        },
        quantity: 1,
      }],
      metadata: { user_id: userId, plan },
      success_url: `${origin}/dashboard?payment=success`,
      cancel_url: `${origin}/dashboard?payment=cancelled`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
