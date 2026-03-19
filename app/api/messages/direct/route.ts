import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// 1. GET: Fetch chat history between Me and a specific user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const receiverId = searchParams.get('receiverId');

    if (!receiverId) return NextResponse.json({ error: "Receiver ID required" }, { status: 400 });

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: receiverId },
          { senderId: receiverId, receiverId: session.user.id }
        ],
        projectId: null // Ensure we only get DMs, not project chats
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

// 2. POST: Send a new Direct Message
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { receiverId, text } = await request.json();

    if (!receiverId || !text) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const newMessage = await prisma.message.create({
      data: {
        text,
        senderId: session.user.id,
        receiverId: receiverId,
        authorId: session.user.id, // Keeping compatibility with Project Chat author logic
      }
    });

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error("SEND_MESSAGE_ERROR:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}