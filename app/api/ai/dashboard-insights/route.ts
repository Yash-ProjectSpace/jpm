import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. Matched to what the frontend actually sends
    const { projects, totalTasks } = body;
    
    // 2. Insert your NEW working API key here
    const API_KEY = "AIzaSyD49bi9vqXnbUGoarNF70TMmGFWbkTtUvk"; 

    // 3. Updated prompt to force exactly 3 insights in a JSON Array
    const prompt = `
      You are a professional productivity coach. Based on this data:
      Projects: ${JSON.stringify(projects)}
      Total Tasks: ${totalTasks || 0}

      Generate EXACTLY 3 distinct productivity insights in Japanese.
      1. First insight: Analyze overall completion or efficiency.
      2. Second insight: Focus on active tasks or workload.
      3. Third insight: Provide an encouraging mindset tip or warning if too busy.

      Output ONLY a valid JSON array of objects. No markdown formatting.
      Format exactly like this:
      [
        {
          "message": "Project A efficiency is up",
          "efficiency": "+15%",
          "alertType": "normal",
          "coachingTip": "Keep up the great work today!"
        },
        { ... },
        { ... }
      ]
    `;

    // 4. Using the highly stable gemini-2.5-flash for 2026 standard requests
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const aiText = data.candidates[0].content.parts[0].text;
    
    // 5. Safe Array Extraction (avoids Markdown crash)
    const start = aiText.indexOf("[");
    const end = aiText.lastIndexOf("]");
    
    if (start === -1 || end === -1) {
      throw new Error("AI did not return a valid JSON array.");
    }

    const insights = JSON.parse(aiText.substring(start, end + 1));

    // Returns the array of 3 objects to power your frontend slider
    return NextResponse.json(insights);
    
  } catch (error: any) {
    console.error("Dashboard AI Error:", error.message);
    return NextResponse.json({ error: "Dashboard insights temporarily unavailable." }, { status: 500 });
  }
}