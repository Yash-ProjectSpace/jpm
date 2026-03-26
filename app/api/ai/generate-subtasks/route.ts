import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { description } = await req.json();
    
    // API Key (Already verified as working in your previous tests)
    const API_KEY = "AIzaSyD49bi9vqXnbUGoarNF70TMmGFWbkTtUvk"; 

    // UPDATED 2026 ENDPOINT: Using Gemini 3 Flash (Preview) or Gemini 2.5 Flash
    // We will use v1beta with gemini-2.5-flash for maximum stability
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `以下のタスクを5つの具体的で実行可能な日本語サブタスクに分解し、JSON配列形式でのみ出力してください。
            タスク: "${description}"
            形式例: ["ステップ1", "ステップ2"]`
          }]
        }]
      })
    });

    const data = await response.json();

    // ERROR HANDLING & FALLBACK
    if (data.error) {
      console.warn("Gemini 2.5 failed, trying Gemini 3 Flash Preview...");
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`;
      const fallbackRes = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `Generate 5 Japanese subtasks for: ${description}. Return JSON array only.` }] }] })
      });
      const fallbackData = await fallbackRes.json();
      
      if (fallbackData.error) throw new Error(`AI Service Error: ${fallbackData.error.message}`);
      return parseGeminiResponse(fallbackData);
    }

    return parseGeminiResponse(data);

  } catch (error: any) {
    console.error("Gemini API Error:", error.message);
    // Returning the actual error so you can see if it's a "Quota" or "Safety" issue
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function parseGeminiResponse(data: any) {
  try {
    const aiText = data.candidates[0].content.parts[0].text;
    const start = aiText.indexOf("[");
    const end = aiText.lastIndexOf("]");
    const subtasks = JSON.parse(aiText.substring(start, end + 1));
    return NextResponse.json({ subtasks });
  } catch (e) {
    throw new Error("AI returned an incompatible text format.");
  }
}