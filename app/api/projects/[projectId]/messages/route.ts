import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request, 
  { params }: { params: { projectId: string } }
) {
  try {
    const messages = await prisma.message.findMany({
      where: { projectId: params.projectId },
      include: {
        // CHANGED: 'user' is now 'author' in the new schema
        author: { select: { id: true, name: true, role: true } },
        reactions: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("MESSAGES_GET_ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(
  request: Request, 
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await request.json();
    const { text } = body;

    if (!text || text.trim() === '') {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

const newMessage = await prisma.message.create({
      data: {
        text,
        projectId: params.projectId,
        // These are the two fields your new schema uses to identify the sender
        authorId: currentUser.id,
        senderId: currentUser.id, 
      },
      include: {
        // Make sure this says 'author' to match the schema
        author: { select: { id: true, name: true, role: true } },
        reactions: true,
      }
    });

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error("MESSAGES_POST_ERROR:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}