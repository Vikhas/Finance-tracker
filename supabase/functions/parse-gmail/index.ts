import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.47.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_API_KEY = Deno.env.get("VITE_GEMINI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface ParsedTransaction {
  amount: number;
  type: "credit" | "debit";
  category: string;
  merchant: string;
  description: string;
  transaction_date: string;
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function parseWithGemini(text: string): Promise<ParsedTransaction[]> {
  const prompt = `You are a financial transaction parser. Extract structured transaction data from the following text.
Return a JSON array of transactions with this exact format:
[{
  "amount": number (positive value),
  "type": "credit" or "debit",
  "category": one of ["Food & Dining", "Shopping", "Transport", "Bills & Utilities", "Entertainment", "Healthcare", "Salary", "Investment", "Other"],
  "merchant": string (store/company name),
  "description": string (brief description),
  "transaction_date": ISO date string (YYYY-MM-DD)
}]

Text to parse:
${text}

Return ONLY valid JSON, no markdown or explanations.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to parse with Gemini");
  }

  const data = await response.json();
  const generatedText = data.candidates[0]?.content?.parts[0]?.text || "[]";
  const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
  const jsonStr = jsonMatch ? jsonMatch[0] : "[]";

  return JSON.parse(jsonStr);
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

    const { emails } = await req.json();

    if (!Array.isArray(emails) || emails.length === 0) {
      throw new Error("No emails provided");
    }

    const allTransactions: Array<ParsedTransaction & { source: string }> = [];

    for (const email of emails) {
      const emailText = `Subject: ${email.subject}\n\nFrom: ${email.from}\n\nContent: ${email.body}`;

      const transactions = await parseWithGemini(emailText);

      for (const transaction of transactions) {
        allTransactions.push({
          ...transaction,
          source: email.id,
        });
      }
    }

    const { error: insertError } = await supabase
      .from("transactions")
      .insert(
        allTransactions.map((t) => ({
          user_id: user.user.id,
          amount: t.amount,
          type: t.type,
          category: t.category,
          merchant: t.merchant,
          description: t.description,
          transaction_date: t.transaction_date,
          raw_text: t.source,
        }))
      );

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        transactionsCount: allTransactions.length,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Parse Gmail error:", error);
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
