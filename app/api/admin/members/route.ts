import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// ==========================================
// 1. メンバー一覧を取得する (GET)
// ==========================================
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    // 管理者以外はアクセス不可にするセキュリティチェック
    if (!session || (session.user as any).role !== 'MANAGER') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // データベースからユーザー一覧を取得（パスワードは除外して安全に）
    const members = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        // image がPrismaスキーマにあれば true にしてください
      }
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("GET_MEMBERS_ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}

// ==========================================
// 2. 新規メンバーを作成する (POST) - ※元のコードをそのまま維持
// ==========================================
export async function POST(request: Request) {
  try {
    // 1. Security Check
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'MANAGER') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { name, email, password, role, department } = await request.json();

    // 2. Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    // 3. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create the User
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        department,
      },
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    console.error("CREATE_USER_ERROR:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

// ==========================================
// 3. メンバーを削除する (DELETE)
// ==========================================
export async function DELETE(request: Request) {
  try {
    // 1. Security Check (管理者のみ削除可能)
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'MANAGER') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 2. URLから削除したいユーザーのIDを取得
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // ★追加：ユーザーを消す前に、紐づいている関連データを一掃する
    // エラー文の "Report_authorId_fkey" から、対象のフィールド名が authorId だと分かります
    await prisma.report.deleteMany({
      where: { authorId: id }
    });

    // 3. 関連データを消した上で、データベースからユーザー本体を完全に削除
    await prisma.user.delete({
      where: { id: id }
    });

    return NextResponse.json({ message: "User and related data deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE_USER_ERROR:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
