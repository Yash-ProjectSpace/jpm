import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// UPDATE a message (Edit)
export async function PUT(
  request: Request,
  { params }: { params: { projectId: string; messageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { text } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Message text is required" }, { status: 400 });
    }

    // Security check: Only the author can edit their message
    const existingMessage = await prisma.message.findUnique({
      where: { id: params.messageId }
    });

    if (!existingMessage || existingMessage.authorId !== (session.user as any).id) {
       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedMessage = await prisma.message.update({
      where: { id: params.messageId },
      data: { text: text.trim() }
    });

    return NextResponse.json(updatedMessage, { status: 200 });
  } catch (error) {
    console.error("PUT Message Error:", error);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string; messageId: string }> } // Change type to Promise
) {
  try {
    // Await the params to unwrap them
    const { messageId } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Security check: Only the author can delete their message
    const existingMessage = await prisma.message.findUnique({
      where: { id: messageId } // Use unwrapped messageId
    });

    if (!existingMessage || existingMessage.authorId !== (session.user as any).id) {
       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.message.delete({
      where: { id: messageId } // Use unwrapped messageId
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE Message Error:", error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}