import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    // 1. Security Check
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'MANAGER') {
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