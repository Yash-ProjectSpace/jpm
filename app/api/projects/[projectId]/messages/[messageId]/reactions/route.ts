import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string; messageId: string }> }
) {
  try {
    // 1. Properly unwrap the Promise params
    const { projectId, messageId } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { emoji } = body;
    const userId = (session.user as any).id;

    // 2. Check for existing reaction using the unwrapped messageId
    const existing = await prisma.reaction.findFirst({
      where: {
        messageId: messageId,
        userId: userId,
        emoji: emoji
      }
    });

    if (existing) {
      // Toggle off: Remove the reaction
      await prisma.reaction.delete({ 
        where: { id: existing.id } 
      });
      return NextResponse.json({ status: 'removed' });
    }

    // 3. Toggle on: Add the reaction
    const newReaction = await prisma.reaction.create({
      data: {
        emoji,
        messageId: messageId,
        userId: userId
      }
    });

    return NextResponse.json(newReaction, { status: 201 });
  } catch (error) {
    console.error("REACTION_ERROR", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}