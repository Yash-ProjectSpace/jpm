import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // Destructure and await here for clarity
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!currentUser || currentUser.role !== 'MANAGER') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { status, feedback } = body; 

    // 4. Update the Report Status
    const updatedReport = await prisma.report.update({
      where: { id: id },
      data: { status }
    });

    // 5. Save feedback if provided
    if (feedback && feedback.trim() !== '') {
      await prisma.comment.create({
        data: {
          text: feedback,
          reportId: id,
          authorId: currentUser.id,
        }
      });
    }

    // 6. Automatically update the Task status
    // Logic: If this report is linked to a task, sync the task status
    if (updatedReport.taskId) {
      await prisma.task.update({
        where: { id: updatedReport.taskId }, // TypeScript knows this is a string now
        data: { 
          status: status === 'APPROVED' ? 'DONE' : 'IN_PROGRESS' 
        }
      });
    }

    return NextResponse.json({ success: true, report: updatedReport });
  } catch (error) {
    console.error("REPORT_REVIEW_ERROR:", error);
    return NextResponse.json({ error: "Failed to review report" }, { status: 500 });
  }
}