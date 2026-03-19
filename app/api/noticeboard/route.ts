import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
// THIS is the line that fixes the crash:
import { authOptions } from '@/lib/auth'; 

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notices = await prisma.notice.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { name: true, department: true } }
      }
    });

    return NextResponse.json(notices);
  } catch (error) {
    console.error("FETCH_NOTICES_ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch notices" }, { status: 500 });
  }
}