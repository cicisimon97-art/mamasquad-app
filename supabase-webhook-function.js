// Edge Function: stripe-webhook
// Deploy this in Supabase Dashboard → Edge Functions → Create → name: "stripe-webhook"
// IMPORTANT: Turn OFF "Enforce JWT verification" for this function
// Then add the webhook URL in Stripe Dashboard (see instructions below)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
  apiVersion: "2023-10-16"
})

const supabase = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
)

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } })
  }

  try {
    const body = await req.text()
    const sig = req.headers.get("stripe-signature")
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")

    let event
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } else {
      event = JSON.parse(body)
    }

    console.log("Webhook event:", event.type)

    // Payment completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object
      const userId = session.metadata?.userId
      if (userId) {
        await supabase.from("users").update({
          verification_status: "paid",
          stripe_customer_id: session.customer
        }).eq("id", userId)
        console.log("User marked as paid:", userId)
      }
    }

    // Identity verification completed
    if (event.type === "identity.verification_session.verified") {
      const session = event.data.object
      const userId = session.metadata?.userId
      if (userId) {
        await supabase.from("users").update({
          is_verified: true,
          verification_status: "verified"
        }).eq("id", userId)
        console.log("User verified:", userId)
      }
    }

    // Identity verification failed
    if (event.type === "identity.verification_session.requires_input") {
      const session = event.data.object
      const userId = session.metadata?.userId
      if (userId) {
        await supabase.from("users").update({
          verification_status: "failed"
        }).eq("id", userId)
        console.log("User verification failed:", userId)
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" }
    })
  } catch (e) {
    console.error("Webhook error:", e.message)
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    })
  }
})
