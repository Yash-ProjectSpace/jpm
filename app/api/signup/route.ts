import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
// ONLY import the singleton instance from your lib to prevent connection leaks
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // 1. Validation
    if (!name || !email || !password) {
      return NextResponse.json({ error: "全ての項目を入力してください" }, { status: 400 });
    }

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: "このメールアドレスは既に登録されています" }, { status: 400 });
    }

    // 3. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create the user
    // IMPORTANT: We add default role and department so they can actually log in
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'EMPLOYEE',    // Default role
        department: 'DX',    // REQUIRED by your authOptions logic
      },
    });

    return NextResponse.json({ 
      message: "ユーザー登録が完了しました", 
      userId: user.id 
    }, { status: 201 });

  } catch (error) {
    // This will show exactly what went wrong in your terminal
    console.error("SIGNUP_API_ERROR:", error);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}