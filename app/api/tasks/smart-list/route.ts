import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  try {
    const tasks = await prisma.task.findMany({
      where: projectId ? { projectId } : {},
      orderBy: [
        { dueDate: 'asc' },   // Nearest deadline first
        { priority: 'desc' }  // Then highest priority
      ],
      // --- UPDATE THIS SECTION ---
      include: { 
        assignee: true,
        project: true  // This ensures the project name is sent to the frontend
      }
      // ----------------------------
    });
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch smart list' }, { status: 500 });
  }
}