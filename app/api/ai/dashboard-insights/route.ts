import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { tasks, projects } = await req.json();
    const API_KEY = "AIzaSyDlu7sVxpR8kZOojCvms-EDGQ3p6fa3f04"; 

    // Instructions for the "AI Productivity Coach"
    const prompt = `
      You are a professional productivity coach. Based on the following task data:
      ${JSON.stringify({ tasks, projects })}

      1. Analyze efficiency (ratio of completed vs pending).
      2. Identify overdue tasks or those due today.
      3. If the schedule is too busy (more than 5 pending tasks), provide a "Mindset Alert."
      4. Give one specific, encouraging sentence about their progress.

      Output ONLY a JSON object:
      {
        "message": "The main insight message...",
        "efficiency": "e.g. 15% increase",
        "alertType": "normal | warning | busy",
        "coachingTip": "One sentence mindset tip"
      }
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    const aiText = data.candidates[0].content.parts[0].text;
    const insights = JSON.parse(aiText.replace(/```json|```/gi, "").trim());

    return NextResponse.json(insights);
  } catch (error) {
    return NextResponse.json({ message: "Dashboard insights temporarily unavailable." }, { status: 500 });
  }
}