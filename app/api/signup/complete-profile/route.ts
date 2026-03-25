import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, department } = body;

    // 1. Validation
    if (!email || !password || !department) {
      return NextResponse.json({ error: "全ての項目を入力してください" }, { status: 400 });
    }

    // 2. ユーザーが存在するか確認（Googleログインによって既に作られているはず）
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    // 3. 既にパスワードが設定されている場合は弾く（セキュリティ対策）
    if (user.password) {
      return NextResponse.json({ error: "このアカウントは既に設定が完了しています" }, { status: 400 });
    }

    // 4. パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. ユーザー情報を更新（パスワードと部署を追加）
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        department: department,
      }
    });

    return NextResponse.json({ message: "プロフィールの設定が完了しました" }, { status: 200 });

  } catch (error) {
    console.error("COMPLETE_PROFILE_API_ERROR:", error);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}