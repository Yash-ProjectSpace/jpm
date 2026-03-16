import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role } = body;

    // 1. Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "必要な項目（名前、メール、パスワード）が入力されていません。" }, 
        { status: 400 }
      );
    }

    // 2. Check for duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "このメールアドレスは既に登録されています。" }, 
        { status: 400 }
      );
    }

    // 3. Hash the password (Security First)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create User in Database
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'EMPLOYEE', // Defaults to EMPLOYEE if not specified
      }
    });

    return NextResponse.json({ 
      message: "メンバーの登録に成功しました。", 
      userId: newUser.id 
    }, { status: 201 });

  } catch (error: any) {
    console.error("Member Creation Error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました。入力を確認してください。" }, 
      { status: 500 }
    );
  }
}

/**
 * Optional: GET request to fetch all members from DB
 * If you use this, you can remove the hardcoded teamMembers array from your page.tsx
 */
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' }
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}