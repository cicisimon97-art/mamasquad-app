import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as jose from "https://deno.land/x/jose@v4.14.4/index.ts";

const APPLE_TEAM_ID = Deno.env.get("APPLE_TEAM_ID")!;
const APPLE_KEY_ID = Deno.env.get("APPLE_KEY_ID")!;
const APPLE_P8_KEY = Deno.env.get("APPLE_P8_KEY")!;
const BUNDLE_ID = "com.mamasquads.app";

// Generate APNs JWT token
async function getApnsToken(): Promise<string> {
  const key = await jose.importPKCS8(APPLE_P8_KEY, "ES256");
  const jwt = await new jose.SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: APPLE_KEY_ID })
    .setIssuer(APPLE_TEAM_ID)
    .setIssuedAt()
    .sign(key);
  return jwt;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { token, title, body } = await req.json();

    if (!token || !title) {
      return new Response(JSON.stringify({ error: "Missing token or title" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apnsToken = await getApnsToken();

    // Send to APNs (production URL)
    const apnsRes = await fetch(
      `https://api.push.apple.com/3/device/${token}`,
      {
        method: "POST",
        headers: {
          "authorization": `bearer ${apnsToken}`,
          "apns-topic": BUNDLE_ID,
          "apns-push-type": "alert",
          "apns-priority": "10",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          aps: {
            alert: {
              title: title,
              body: body || "",
            },
            sound: "default",
            badge: 1,
          },
        }),
      }
    );

    if (!apnsRes.ok) {
      const errText = await apnsRes.text();
      return new Response(JSON.stringify({ error: errText }), {
        status: apnsRes.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
