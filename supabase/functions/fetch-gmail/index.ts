import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.47.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface GmailToken {
  access_token: string;
  refresh_token: string | null;
  expires_at: string;
}

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload?: {
    mimeType: string;
    headers: Array<{ name: string; value: string }>;
    body?: { data?: string };
    parts?: Array<{
      mimeType: string;
      body?: { data?: string };
    }>;
  };
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh access token");
  }

  const data = await response.json();
  return data.access_token;
}

function extractEmailBody(payload: GmailMessage["payload"]): string {
  if (!payload) return "";

  if (payload.body?.data) {
    try {
      return atob(payload.body.data);
    } catch {
      return payload.body.data;
    }
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        try {
          return atob(part.body.data);
        } catch {
          return part.body.data;
        }
      }
    }
  }

  return "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: user } = await supabase.auth.getUser(token);

    if (!user?.user?.id) {
      throw new Error("Unauthorized");
    }

    const { data: gmailToken, error: tokenError } = await supabase
      .from("gmail_tokens")
      .select("access_token, refresh_token, expires_at")
      .eq("user_id", user.user.id)
      .maybeSingle();

    if (tokenError || !gmailToken) {
      throw new Error("No Gmail token found. Please connect your Gmail account.");
    }

    let accessToken = gmailToken.access_token;

    if (gmailToken.expires_at && new Date(gmailToken.expires_at) < new Date()) {
      if (!gmailToken.refresh_token) {
        throw new Error("Token expired and no refresh token available");
      }
      accessToken = await refreshAccessToken(gmailToken.refresh_token);
    }

    const listResponse = await fetch(
      "https://www.googleapis.com/gmail/v1/users/me/messages?q=label:INBOX&maxResults=20",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!listResponse.ok) {
      throw new Error("Failed to fetch Gmail messages");
    }

    const messageList = await listResponse.json();
    const messages = messageList.messages || [];

    const emailsWithContent = await Promise.all(
      messages.slice(0, 10).map(async (msg: { id: string }) => {
        const msgResponse = await fetch(
          `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!msgResponse.ok) {
          return null;
        }

        const messageData = (await msgResponse.json()) as GmailMessage;
        const body = extractEmailBody(messageData.payload);
        const subject =
          messageData.payload?.headers?.find((h) => h.name === "Subject")?.value ||
          "";

        return {
          id: messageData.id,
          subject,
          snippet: messageData.snippet,
          body,
          from: messageData.payload?.headers?.find((h) => h.name === "From")?.value || "",
        };
      })
    );

    const validEmails = emailsWithContent.filter((e) => e !== null);

    return new Response(JSON.stringify(validEmails), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Gmail fetch error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});
