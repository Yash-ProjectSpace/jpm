import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'MANAGER') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notices = await prisma.notice.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(notices);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
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
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.notice.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

