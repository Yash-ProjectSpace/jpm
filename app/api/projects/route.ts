import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
// GET: Fetch projects (Master Key for Managers, Filtered for Users)
export async function GET() {
  try {
    // 1. Get the logged-in user's session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const user = session.user as any;

    // 2. THE MASTER KEY: Managers see everything ({}), Users see only their own projects
    const whereClause = user.role === 'MANAGER' 
      ? {} 
      : { members: { some: { id: user.id } } };

    // 3. Fetch projects with the role-based filter applied
    const projects = await prisma.project.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        members: {
          select: { id: true, name: true, role: true } // Removed avatar to avoid Prisma errors
        },
        tasks: true
      }
    });
    
    // 4. Return the data with headers that explicitly tell Next.js NOT to cache this!
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
    // 1. Get the logged-in user's session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = (session.user as any).id;
    const body = await request.json();
    const { name, description, status, startDate, endDate, driveLink } = body;

    // Basic validation
    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    // 2. Create the project and connect the creator
    const newProject = await prisma.project.create({
      data: {
        name,
        description,
        status: status || "進行中",
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        driveLink,
        members: {
          connect: { id: userId } // Automatically add the creator as a team member
        }
      },
      include: {
        members: {
          select: { id: true, name: true, role: true }
        }
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
    // Basic security check for delete as well
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
    // 1. Security check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Extract the updated data from the request body
    const body = await request.json();
    const { id, name, description, status, startDate, endDate, driveLink } = body;

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required for updating' }, { status: 400 });
    }

    // 3. Update the project in the database
    const updatedProject = await prisma.project.update({
      where: { id: id },
      data: {
        name,
        description,
        status,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        driveLink,
      },
      include: {
        members: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    return NextResponse.json(updatedProject, { status: 200 });
  } catch (error) {
    console.error("PUT Project Error:", error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}