import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: Fetch projects (Master Key for Managers, Filtered for Users)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const user = session.user as any;

    // THE MASTER KEY: Managers see everything, Users see only their own projects
    const whereClause = user.role === 'MANAGER' 
      ? {} 
      : { members: { some: { id: user.id } } };

    const projects = await prisma.project.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        members: {
          select: { id: true, name: true, role: true } 
        },
        tasks: true // Required for the Donut Chart!
      }
    });
    
    return NextResponse.json(projects, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
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
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = (session.user as any).id;
    const body = await request.json();
    const { name, description, status, startDate, endDate, driveLink, memberIds } = body;

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    // Always keep the creator in the project
    const membersToConnect = [{ id: userId }];
    
    // Add assigned members, preventing duplication of the creator
    if (memberIds && Array.isArray(memberIds)) {
      memberIds.forEach((id: string) => {
        if (id !== userId) {
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
        members: {
          select: { id: true, name: true, role: true }
        },
        tasks: true // Required for the Donut Chart!
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
    // FIXED: Now we are properly extracting memberIds during an edit!
    const { id, name, description, status, startDate, endDate, driveLink, memberIds } = body;

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required for updating' }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {
      name,
      description,
      status,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      driveLink,
    };

    // FIXED: If memberIds are provided, overwrite the current members list
    if (memberIds && Array.isArray(memberIds)) {
      updateData.members = {
        set: memberIds.map((memberId: string) => ({ id: memberId }))
      };
    }

    const updatedProject = await prisma.project.update({
      where: { id: id },
      data: updateData,
      include: {
        members: {
          select: { id: true, name: true, role: true }
        },
        tasks: true // FIXED: Added tasks here so the Donut chart doesn't crash after editing!
      }
    });

    return NextResponse.json(updatedProject, { status: 200 });
  } catch (error) {
    console.error("PUT Project Error:", error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}