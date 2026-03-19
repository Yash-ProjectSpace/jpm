import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(request: Request) {
  try {
    // 1. Security Check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Grab the Task ID and the New Status from the drag-and-drop action
    const { taskId, status } = await request.json();

    if (!taskId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 3. Update the database
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status: status }, // e.g., changes "TODO" to "IN_PROGRESS"
    });

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error("TASK_UPDATE_ERROR:", error);
    return NextResponse.json({ error: "Failed to update task status" }, { status: 500 });
  }
}