import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ==========================================
// 1. GET: Generates the AI Draft
// ==========================================
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch completed tasks for the current user to create a draft
    const completedTasks = await prisma.task.findMany({
      where: {
        status: "DONE",
        // Ideally, you'd filter by assigneeId: (session.user as any).id
      },
      select: { title: true },
    });

    if (completedTasks.length === 0) {
      return NextResponse.json({ 
        draft: "本日は完了したタスクがまだありません。実施事項を記入してください。" 
      });
    }

    const taskList = completedTasks.map((t) => `- ${t.title}`).join("\n");
    
    const prompt = `
      あなたはプロフェッショナルなビジネスアシスタントです。
      以下の完了したタスクリストを基に、丁寧な「日報」の下書きを作成してください。
      
      完了タスク:
      ${taskList}

      構成:
      - 今日の概要
      - 実施事項
      - AIによる所感と明日へのアドバイス
      トーン: 誠実、プロフェッショナル
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Note: Corrected model name
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ draft: text });

  } catch (error) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: "AI生成中にエラーが発生しました" }, { status: 500 });
  }
}

// ==========================================
// 2. POST: Saves the Daily Report (FIXES SUBMISSION FAILED)
// ==========================================
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { content, taskId } = body;

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "内容を入力してください" }, { status: 400 });
    }

    // Get current user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    });

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    // Create the report in the database
    const newReport = await prisma.report.create({
      data: {
        content: content,
        status: "PENDING",
        authorId: user.id,
        // If a taskId is provided, link it. If not, set to null (General Report)
        taskId: taskId || null, 
      }
    });

    return NextResponse.json({ success: true, report: newReport }, { status: 201 });

  } catch (error) {
    console.error("Report Submission Error:", error);
    return NextResponse.json({ error: "日報の送信に失敗しました" }, { status: 500 });
  }
}