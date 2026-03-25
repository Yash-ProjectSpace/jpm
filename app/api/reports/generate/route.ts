import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // --- DEBUG STEP: SEARCH EVERYTHING ---
    // We are temporarily removing 'assigneeId' to see if it finds ANY 'DONE' tasks
    const completedTasks = await prisma.task.findMany({
      where: { 
        status: "DONE" 
      },
      select: { title: true, assigneeId: true },
    });

    console.log("------------------------------------------");
    console.log("LOGGED IN USER ID:", user.id);
    console.log("TOTAL DONE TASKS IN DB:", completedTasks.length);
    
    completedTasks.forEach((t, i) => {
      console.log(`Task ${i+1}: ${t.title} | Owner ID: ${t.assigneeId}`);
    });
    console.log("------------------------------------------");

    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

    let taskContent = completedTasks.length === 0 
      ? "本日はシステム上で完了（DONE）として記録されたタスクはありません。" 
      : completedTasks.map((t) => `- ${t.title}`).join("\n");
    
    const prompt = `
      From: ${user.name}
      ■ 本日の実施事項
      ${taskContent} 
      ■ [Remarks / Plans Going Forward]
      (今日の内容に基づき、明日以降の予定を日本語で2文で。)
      
      制約: 前置きは一切禁止。Fromから始めてください。
    `;

    const result = await model.generateContent(prompt);
    return NextResponse.json({ draft: result.response.text() });

  } catch (error: any) {
    console.error("CRITICAL ERROR:", error);
    return NextResponse.json({ error: "Failed", details: error.message }, { status: 500 });
  }
}