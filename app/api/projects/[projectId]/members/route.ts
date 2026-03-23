import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const resolvedParams = await params;
    const projectId = resolvedParams.projectId;

    // Security check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user ID they want to add
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Connect the user to the project's 'members' array
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        members: {
          connect: { id: userId }
        }
      },
      include: {
        members: {
          // FIX: Removed 'avatar: true' because it's not in your schema!
          select: { id: true, name: true, role: true } 
        }
      }
    });

    return NextResponse.json(updatedProject, { status: 200 });

  } catch (error) {
    console.error("Assign Member Error:", error);
    return NextResponse.json({ error: "Failed to assign member to project" }, { status: 500 });
  }
}