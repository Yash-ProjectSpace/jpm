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
    // Use type casting if red lines persist: (prisma.user as any).findUnique
    const existingUser = await prisma.user.findUnique({
      where: { email: email as string }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "このメールアドレスは既に登録されています。" }, 
        { status: 400 }
      );
    }

    // 3. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create User in Database
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'EMPLOYEE',
      }
    });

    return NextResponse.json({ 
      message: "メンバーの登録に成功しました。", 
      userId: newUser.id 
    }, { status: 201 });

  } catch (error: any) {
    console.error("Member Creation Error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました。" }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Explicitly fetching fields to satisfy the new schema relations
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        // We explicitly omit the message arrays here to keep the GET clean
      },
      orderBy: { createdAt: 'asc' }
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("GET_MEMBERS_ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}