import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch all projects including their task counts filtered by status
    const projectsWithStats = await prisma.project.findMany({
      include: {
        _count: {
          select: {
            tasks: true,
          }
        },
        tasks: {
          select: {
            status: true
          }
        }
      }
    });

    // Format the data for the frontend
    const projectData = projectsWithStats.map(project => {
      const doneTasks = project.tasks.filter(t => t.status === 'DONE').length;
      const totalTasks = project.tasks.length;
      
      return {
        id: project.id,
        name: project.name,
        totalTasks,
        doneTasks,
        activeTasks: totalTasks - doneTasks,
        completionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
      };
    });

    const teamMembers = await prisma.user.count();

    return NextResponse.json({
      projects: projectData,
      teamMembers
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}