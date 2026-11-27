import { createClient } from "@supabase/supabase-js";

const ALLOWED_SOURCES = new Set([
  "sidebar_left",
  "sidebar_right",
  "mobile_bottom",
  "settings_social",
  "settings_card",
  "settings_qr",
]);

interface NetlifyGeo {
  city?: string;
  country?: {
    code?: string;
    name?: string;
  };
}

function extractGeo(headers: Headers): { country: string | null; city: string | null } {
  const nfGeo = headers.get("x-nf-geo");
  if (nfGeo) {
    try {
      const decoded = Buffer.from(nfGeo, "base64").toString("utf-8");
      const parsed = JSON.parse(decoded) as NetlifyGeo;
      const code = parsed.country?.code?.trim();
      const name = parsed.country?.name?.trim();
      const country =
        name && code ? `${name} (${code})` : name || code || null;
      const city = parsed.city?.trim() || null;
      return { country, city };
    } catch {
      // Base64 / JSON parse hatasinda fallback'e gec
    }
  }

  const fallbackCountry =
    headers.get("x-vercel-ip-country") ||
    headers.get("cf-ipcountry") ||
    null;
  const fallbackCity = headers.get("x-vercel-ip-city") || null;

  return {
    country: fallbackCountry ? fallbackCountry.slice(0, 80) : null,
    city: fallbackCity ? fallbackCity.slice(0, 80) : null,
  };
}

function cleanString(value: unknown, maxLen: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, maxLen) : null;
}

export async function POST(request: Request) {
  try {
    const rawText = await request.text();
    if (!rawText) {
      return Response.json({ error: "Empty body" }, { status: 400 });
    }

    const body = JSON.parse(rawText) as Record<string, unknown>;
    const source = cleanString(body.source, 40);
    if (!source || !ALLOWED_SOURCES.has(source)) {
      return Response.json({ error: "Invalid source" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return Response.json({ error: "Supabase config missing" }, { status: 500 });
    }

    const { country, city } = extractGeo(request.headers);

    const rawDuration = Number(body.session_duration_sec);
    const sessionDurationSec =
      Number.isFinite(rawDuration) && rawDuration >= 0
        ? Math.min(Math.round(rawDuration), 86400 * 7)
        : null;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    const { error } = await supabase.from("ad_clicks").insert({
      source,
      page_path: cleanString(body.page_path, 200),
      device: cleanString(body.device, 30),
      os: cleanString(body.os, 40),
      browser: cleanString(body.browser, 40),
      screen_size: cleanString(body.screen_size, 30),
      visitor_id: cleanString(body.visitor_id, 64),
      country,
      city,
      session_duration_sec: sessionDurationSec,
    });

    if (error) {
      console.warn("ad_clicks insert error:", error.message);
      return Response.json({ ok: false, error: error.message }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.warn("ad-click route error:", err);
    return Response.json({ ok: false }, { status: 400 });
  }
}
