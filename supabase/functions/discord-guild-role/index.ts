import { serve } from "https://deno.land/std@0.210.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

const ROLE_ORDER = [
  { id: "740263292563488768", name: "Champion" },
  { id: "709541336256086137", name: "Master Builder" },
  { id: "352490232505040898", name: "Senior Builder" },
  { id: "131898053375426560", name: "Builder" },
  { id: "692801758761844746", name: "Novice Builder" },
  { id: "692802742200172634", name: "Trial Builder" }
];

const ENGINEER_ROLE_ID = "928427981867741265";

type RoleResponse = {
  role: string;
  is_engineer: boolean;
  in_guild: boolean;
  roles: string[];
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders
    }
  });
}

async function resolveDiscordId(req: Request) {
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader) return "";

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY") || "";
  if (!supabaseUrl || !supabaseAnon) return "";

  const sb = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: authHeader } }
  });
  const { data, error } = await sb.auth.getUser();
  if (error || !data?.user) return "";
  const meta = data.user.user_metadata || {};
  const discordId =
    meta.provider_id
    || meta.sub
    || data.user.identities?.find((i) => i.provider === "discord")?.id
    || "";
  return String(discordId || "");
}

function pickRole(roleIds: string[]) {
  if (roleIds.includes(ENGINEER_ROLE_ID)) {
    return { name: "Engineer", is_engineer: true };
  }
  const matched = ROLE_ORDER.find((r) => roleIds.includes(r.id));
  if (matched) return { name: matched.name, is_engineer: false };
  return { name: "Builder", is_engineer: false };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const token = Deno.env.get("DISCORD_BOT_TOKEN");
  const guildId = Deno.env.get("DISCORD_GUILD_ID");
  if (!token || !guildId) {
    return jsonResponse({ error: "Missing DISCORD_BOT_TOKEN or DISCORD_GUILD_ID" }, 500);
  }

  let payload: { discord_id?: string } = {};
  try {
    payload = await req.json();
  } catch (_err) {
    payload = {};
  }

  let discordId = String(payload.discord_id || "").trim();
  if (!discordId) {
    discordId = await resolveDiscordId(req);
  }
  if (!discordId) {
    return jsonResponse({ error: "discord_id is required" }, 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  let res: Response;
  try {
    res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordId}`, {
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
    const response: RoleResponse = { role: "Builder", is_engineer: false, in_guild: false, roles: [] };
    return jsonResponse(response, 200);
  }

  const member = await res.json();
  const roleIds = Array.isArray(member?.roles) ? member.roles : [];
  const chosen = pickRole(roleIds);

  const response: RoleResponse = {
    role: chosen.name,
    is_engineer: chosen.is_engineer,
    in_guild: true,
    roles: roleIds
  };

  return jsonResponse(response);
});
