import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 1. POST: Create a new task with Checklist
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
      // --- ADD THIS TO FETCH PROJECT NAME ---
      include: {
        project: true, 
      },
      // --------------------------------------
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error("Task POST Error:", error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

// 2. PUT: Update checklist items or task status
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
        // Ensure date is properly formatted if being updated
        dueDate: dueDate ? new Date(dueDate) : undefined, 
      },
      // --- ADD THIS TO KEEP PROJECT NAME VISIBLE AFTER UPDATE ---
      include: {
        project: true,
      },
      // ---------------------------------------------------------
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Task PUT Error:", error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// 3. DELETE: Remove a task
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