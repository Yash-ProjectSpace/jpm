import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Your original project fetching logic
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

    let overallTotalTasks = 0; // NEW: Track total tasks for the AI Coach

// 2. Your original formatting logic
    const projectData = projectsWithStats.map((project: { id: string; name: string; tasks: { status: string }[] }) => {
      // Added (t: { status: string }) here
      const doneTasks = project.tasks.filter((t: { status: string }) => t.status === 'DONE').length;
      const totalTasks = project.tasks.length;
      
      overallTotalTasks += totalTasks; 
      
      return {
        id: project.id,
        name: project.name,
        totalTasks,
        doneTasks,
        activeTasks: totalTasks - doneTasks,
        completionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
      };
    });
    // 3. Your original team members fetch
    const teamMembers = await prisma.user.count();

// 4. Fetch REAL Notices from the Database
    const dbNotices = await prisma.notice.findMany({
      orderBy: { 
        createdAt: 'desc' 
      },
      take: 3,  // Keep the dashboard clean by only showing the 3 newest
    });

// Format them for the frontend
    // Added (n: { id: string; type: string; title: string; createdAt: Date }) here
    const notices = dbNotices.length > 0 ? dbNotices.map((n: { id: string; type: string; title: string; createdAt: Date }) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      date: new Intl.DateTimeFormat('ja-JP', { month: 'long', day: 'numeric' }).format(new Date(n.createdAt))
    })) : [
      { id: 'empty', type: 'INFO', title: '新しいお知らせはありません', date: '-' }
    ];

    // 5. Return everything exactly as the Dashboard expects
    return NextResponse.json({
      projects: projectData,
      teamMembers,
      totalTasks: overallTotalTasks, // Passed to AI
      notices // Passed to Broadcasts card
    });

  } catch (error) {
    console.error("Stats API Error:", error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}