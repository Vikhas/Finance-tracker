const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export interface ParsedTransaction {
  amount: number;
  type: 'credit' | 'debit';
  category: string;
  merchant: string;
  description: string;
  transaction_date: string;
}

export async function parseTransactionText(text: string): Promise<ParsedTransaction[]> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
    throw new Error('Please add your Gemini API key to the .env file');
  }

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

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to parse transaction with Gemini API');
    }

    const data = await response.json();
    const generatedText = data.candidates[0]?.content?.parts[0]?.text || '[]';

    const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? jsonMatch[0] : '[]';

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error parsing transaction:', error);
    throw error;
  }
}

export async function askGemini(question: string, transactions: unknown[]): Promise<string> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
    throw new Error('Please add your Gemini API key to the .env file');
  }

  const prompt = `You are a financial assistant. Answer the user's question based on their transaction data.

Transaction Data:
${JSON.stringify(transactions, null, 2)}

User Question: ${question}

Provide a clear, concise answer with specific numbers and insights.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get response from Gemini API');
    }

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || 'Sorry, I could not generate a response.';
  } catch (error) {
    console.error('Error asking Gemini:', error);
    throw error;
  }
}
