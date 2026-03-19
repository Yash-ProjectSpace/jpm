import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// 1. UPDATE USER (Role or Department)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'MANAGER') return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { role, department } = await request.json();

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role, department }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// 2. DELETE USER
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    // Prevent admin from deleting themselves!
    if (session?.user?.id === id) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}