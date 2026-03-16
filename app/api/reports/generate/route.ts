import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Get Today's Start and End timestamps
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 2. Fetch tasks completed by THIS user TODAY
    const completedTasks = await prisma.task.findMany({
      where: {
        assigneeId: session.user.id,
        status: "DONE",
        updatedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: { title: true },
    });

    if (completedTasks.length === 0) {
      return NextResponse.json({ 
        draft: "本日は完了したタスクがまだありません。進捗があれば記入してください。" 
      });
    }

    // 3. Prepare the prompt for Gemini
    // --- FIXED: Added explicit type { title: string } to 't' ---
    const taskList = completedTasks.map((t: { title: string }) => `- ${t.title}`).join("\n");
    
    const prompt = `
      あなたはプロフェッショナルなビジネスアシスタントです。
      以下の完了したタスクリストを基に、丁寧な「日報」の下書きを作成してください。
      
      完了タスク:
      ${taskList}

      構成:
      - 今日の概要（一言）
      - 実施事項（具体的に）
      - AIによる所感と明日へのアドバイス
      
      トーン: 誠実、プロフェッショナル、ポジティブ
    `;

    // 4. Call Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ draft: text });

  } catch (error) {
    console.error("AI Report Error:", error);
    return NextResponse.json({ error: "AI生成中にエラーが発生しました" }, { status: 500 });
  }
}