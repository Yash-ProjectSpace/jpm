import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// ------------------------------------------------------------------
// 0. GET: Fetch all tasks for the Kanban Board (NEW!)
// ------------------------------------------------------------------
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        assignee: { select: { name: true } },
        project: { select: { name: true } }
      }
    });

    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

// ------------------------------------------------------------------
// 1. POST: Create a new task with Checklist (YOUR EXISTING CODE)
// ------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, priority, dueDate, projectId, checklist } = body;

    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        checklist: checklist || [], 
        status: "TODO",
      },
      include: {
        project: true, 
      },
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error("Task POST Error:", error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

// ------------------------------------------------------------------
// 2. PUT: Update checklist items or task status (YOUR EXISTING CODE)
// ------------------------------------------------------------------
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, checklist, status, assigneeId, title, description, dueDate, priority } = body;

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        checklist,
        status,
        assigneeId,
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined, 
      },
      include: {
        project: true,
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Task PUT Error:", error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// ------------------------------------------------------------------
// 3. DELETE: Remove a task (YOUR EXISTING CODE)
// ------------------------------------------------------------------
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}