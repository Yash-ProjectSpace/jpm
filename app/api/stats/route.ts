import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    // 1. Identify who is asking for the stats
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    // 2. The "Master Key" Logic:
    // If Manager -> See everything ({})
    // If Employee -> See only projects where they are a member
    const whereClause = user.role === 'MANAGER' 
      ? {} 
      : { members: { some: { id: user.id } } };

    // 3. Fetch projects with the privacy filter applied
    const projectsWithStats = await prisma.project.findMany({
      where: whereClause,
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

    let overallTotalTasks = 0;

    // 4. Format project data
    const projectData = projectsWithStats.map((project: { id: string; name: string; tasks: { status: string }[] }) => {
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

    // 5. Fetch team members count
    const teamMembers = await prisma.user.count();

    // 6. Fetch REAL Notices from the Database
    const dbNotices = await prisma.notice.findMany({
      orderBy: { 
        createdAt: 'desc' 
      },
      take: 3,  // Keep the dashboard clean by only showing the 3 newest
    });

// Format notices for the frontend
    const notices = dbNotices.length > 0 ? dbNotices.map((n: any) => ({
      id: n.id,
      type: n.type || 'INFO', // Added a fallback just in case it's null in DB
      title: n.title,
      date: n.createdAt ? new Intl.DateTimeFormat('ja-JP', { month: 'long', day: 'numeric' }).format(new Date(n.createdAt)) : '-'
    })) : [
      { id: 'empty', type: 'INFO', title: '新しいお知らせはありません', date: '-' }
    ];

    // 7. Return everything securely
    return NextResponse.json({
      projects: projectData,
      teamMembers,
      totalTasks: overallTotalTasks,
      notices
    });

  } catch (error) {
    console.error("Stats API Error:", error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}