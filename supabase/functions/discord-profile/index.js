import { serve } from "https://deno.land/std@0.210.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders
    }
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const token = Deno.env.get("DISCORD_BOT_TOKEN");
  if (!token) {
    return jsonResponse({ error: "Missing DISCORD_BOT_TOKEN" }, 500);
  }

  let payload = {};
  try {
    payload = await req.json();
  } catch (_err) {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const discordId = String(payload.discord_id || "").trim();
  if (!discordId) {
    return jsonResponse({ error: "discord_id is required" }, 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  let res;
  try {
    res = await fetch(`https://discord.com/api/v10/users/${discordId}`, {
      headers: {
        Authorization: `Bot ${token}`
      },
      signal: controller.signal
    });
  } catch (_err) {
    clearTimeout(timeout);
    return jsonResponse({ error: "Discord request timed out" }, 504);
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    return jsonResponse({ error: "Discord lookup failed" }, res.status);
  }

  const user = await res.json();
  const username = user.global_name || user.username || "";
  let avatarUrl = "";
  if (user.avatar) {
    avatarUrl = `https://cdn.discordapp.com/avatars/${discordId}/${user.avatar}.png?size=128`;
  } else {
    const idNum = Number(discordId);
    const index = Number.isFinite(idNum) ? Math.abs(idNum) % 6 : 0;
    avatarUrl = `https://cdn.discordapp.com/embed/avatars/${index}.png`;
  }

  return jsonResponse({ username, avatar_url: avatarUrl });
});
