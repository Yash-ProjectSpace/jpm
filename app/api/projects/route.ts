import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: Fetch projects (Master Key for Managers, Filtered for Users)
// FIX 1: Added `request: Request` to force Next.js to ALWAYS fetch fresh data
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // FIX 2: Fetch the exact role from the Database to avoid NextAuth session bugs
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // THE MASTER KEY: Managers see everything, Users see only their own projects
    const whereClause = dbUser.role === 'MANAGER' 
      ? {} 
      : { members: { some: { id: dbUser.id } } };

    const projects = await prisma.project.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        members: {
          select: { id: true, name: true, role: true } 
        },
        tasks: true // Required for the Donut Chart & Auto-Completion!
      }
    });

    // FIX 3: SMART AUTO-COMPLETION
    // If a user finishes all tasks, ensure the project status is marked as '完了'
    const computedProjects = projects.map(p => {
      let currentStatus = p.status;
      
      if (p.tasks && p.tasks.length > 0) {
        // Check if every single task is marked as DONE or 完了
        const allTasksCompleted = p.tasks.every(t => t.status === 'DONE' || t.status === '完了');
        
        // If all tasks are done, automatically treat the project as finished for the Admin Dashboard
        if (allTasksCompleted && currentStatus !== '完了' && currentStatus !== 'COMPLETED') {
          currentStatus = '完了';
        }
      }

      return {
        ...p,
        status: currentStatus
      };
    });
    
    return NextResponse.json(computedProjects, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error("GET Projects Error:", error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST: Create a brand new project AND assign the creator
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await request.json();
    const { name, description, status, startDate, endDate, driveLink, memberIds } = body;

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    // Always keep the creator in the project
    const membersToConnect = [{ id: dbUser.id }];
    
    // Add assigned members, preventing duplication of the creator
    if (memberIds && Array.isArray(memberIds)) {
      memberIds.forEach((id: string) => {
        if (id !== dbUser.id) {
          membersToConnect.push({ id });
        }
      });
    }

    const newProject = await prisma.project.create({
      data: {
        name,
        description,
        status: status || "進行中",
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        driveLink,
        members: {
          connect: membersToConnect 
        }
      },
      include: {
        members: { select: { id: true, name: true, role: true } },
        tasks: true 
      }
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("POST Project Error:", error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}

// DELETE: Remove a project
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    await prisma.project.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error("DELETE Project Error:", error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}

// PUT: Update an existing project
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, status, startDate, endDate, driveLink, memberIds } = body;

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required for updating' }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {
      name,
      description,
      status, // The manual status update from the user
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      driveLink,
    };

    // If memberIds are provided, overwrite the current members list
    if (memberIds && Array.isArray(memberIds)) {
      updateData.members = {
        set: memberIds.map((memberId: string) => ({ id: memberId }))
      };
    }

    const updatedProject = await prisma.project.update({
      where: { id: id },
      data: updateData,
      include: {
        members: { select: { id: true, name: true, role: true } },
        tasks: true 
      }
    });

    return NextResponse.json(updatedProject, { status: 200 });
  } catch (error) {
    console.error("PUT Project Error:", error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}