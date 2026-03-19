import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { content } = await request.json();

    // Create the Daily Report
    // Note: We leave taskId as null because this is a general daily report
const report = await prisma.report.create({
      data: {
        content,
        authorId: currentUser.id,
        // We explicitly tell it taskId is null to satisfy the new optional relation
        taskId: null, 
      }
    });
    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to submit daily report" }, { status: 500 });
  }
}