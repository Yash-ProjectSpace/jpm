import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Adjust based on your auth file location
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  // Security Check: Only let Managers in
  if (!session || session.user.role !== 'MANAGER') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch company-wide data
  const [totalProjects, totalUsers, delayedProjects] = await Promise.all([
    prisma.project.count(),
    prisma.user.count(),
    prisma.project.count({ where: { status: 'DELAYED' } }), // Adjust based on your schema
  ]);

  return NextResponse.json({
    totalProjects,
    totalUsers,
    delayedProjects,
    systemEfficiency: "92%", // Example hardcoded for now
  });
}