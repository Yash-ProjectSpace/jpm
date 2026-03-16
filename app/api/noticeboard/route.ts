import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  try {
    const notices = await prisma.notice.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(notices);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch notices" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'MANAGER') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
   // Inside your POST function in /api/noticeboard/route.ts
const { title, type, category } = await req.json(); 
const notice = await prisma.notice.create({
  data: { 
    title, 
    type,
    category 
  }
});
    return NextResponse.json(notice);
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json({ error: "Failed to create notice" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (session?.user?.role !== 'MANAGER') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    await prisma.notice.delete({
      where: { id }
    });
    return NextResponse.json({ message: "Notice deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}