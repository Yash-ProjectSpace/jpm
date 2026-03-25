import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface UserWithRole {
  id: string;
  role: string;
  name: string | null;
  email: string | null;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentUser = await prisma.user.findUnique({ 
      where: { email: session.user.email } 
    }) as UserWithRole | null;

    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    let reports;
    if (currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN') {
      reports = await prisma.report.findMany({
        include: {
          author: { select: { name: true } },
          comments: {
            include: { author: { select: { name: true } } },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      reports = await prisma.report.findMany({
        where: { authorId: currentUser.id },
        include: {
          comments: {
            include: { author: { select: { name: true } } },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    return NextResponse.json(reports);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentUser = await prisma.user.findUnique({ 
      where: { email: session.user.email } 
    });

    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { content, taskId } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const newReport = await prisma.report.create({
      data: {
        content: content.trim(),
        authorId: currentUser.id,
        taskId: taskId || null,
        status: 'PENDING'
      }
    });

    return NextResponse.json(newReport, { status: 201 });
  } catch (error) {
    console.error("REPORT_POST_ERROR:", error);
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
  }
}