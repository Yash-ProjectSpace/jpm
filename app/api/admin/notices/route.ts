import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // FIX 1: Explicitly check for session.user.email so TypeScript knows it's a guaranteed string
    if (!session?.user?.email || session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Now TypeScript is happy because it knows session.user.email is definitely a string!
    const currentUser = await prisma.user.findUnique({ 
      where: { email: session.user.email } 
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { title, content, category } = await request.json();

    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        category,
        authorId: currentUser.id,
      }
    });

    return NextResponse.json({ success: true, notice }, { status: 201 });
  } catch (error) {
    console.error("NOTICE_CREATE_ERROR:", error);
    return NextResponse.json({ error: "Failed to create notice" }, { status: 500 });
  }
}