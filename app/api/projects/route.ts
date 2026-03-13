import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Use your existing helper

// GET: Fetch all projects from the database
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        members: true, // Includes the team members in the response
      }
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error("GET Projects Error:", error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST: Create a brand new project
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, status, startDate, endDate, driveLink } = body;

    // Basic validation to ensure name is provided
    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const newProject = await prisma.project.create({
      data: {
        name,
        description,
        status: status || "進行中",
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        driveLink,
      },
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("POST Project Error:", error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}

// --- ADDED DELETE FUNCTION BELOW ---

export async function DELETE(request: Request) {
  try {
    // We get the ID from the URL (e.g., /api/projects?id=clx...)
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