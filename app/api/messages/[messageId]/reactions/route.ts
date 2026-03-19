import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: Request, 
  { params }: { params: { messageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await request.json();
    const { emoji } = body; // e.g., "👍", "🔥", "👀"

    if (!emoji) return NextResponse.json({ error: "Emoji is required" }, { status: 400 });

    // Check if this exact user already reacted with this exact emoji on this message
    const existingReaction = await prisma.reaction.findFirst({
      where: {
        messageId: params.messageId,
        userId: currentUser.id,
        emoji: emoji
      }
    });

    if (existingReaction) {
      // TOGGLE OFF: If it exists, delete it
      await prisma.reaction.delete({ where: { id: existingReaction.id } });
      return NextResponse.json({ message: "Reaction removed", action: "removed" });
    } else {
      // TOGGLE ON: If it doesn't exist, create it
      const newReaction = await prisma.reaction.create({
        data: {
          emoji,
          messageId: params.messageId,
          userId: currentUser.id,
        }
      });
      return NextResponse.json({ message: "Reaction added", action: "added", reaction: newReaction }, { status: 201 });
    }

  } catch (error) {
    console.error("REACTION_POST_ERROR:", error);
    return NextResponse.json({ error: "Failed to toggle reaction" }, { status: 500 });
  }
}
