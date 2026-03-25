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

  // 1. Calculate the date for 6 months ago to get a trend
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  // Fetch company-wide data including specific project details for the chart
  const [totalProjects, totalUsers, delayedProjects, projectList] = await Promise.all([
    prisma.project.count(),
    prisma.user.count({ where: { role: { not: 'MANAGER' } } }), // Exclude Manager from count
    prisma.project.count({ where: { status: 'DELAYED' } }),
    prisma.project.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, status: true },
    }),
  ]);

  // 2. Process projectList into Chart Data (Monthly grouping)
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const velocityData: Record<string, { month: string, created: number, completed: number }> = {};

  // Initialize the last 6 months with zeros so the chart isn't empty
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const mName = monthNames[d.getMonth()];
    velocityData[mName] = { month: mName, created: 0, completed: 0 };
  }

  // Fill data from database
  projectList.forEach((project) => {
    const monthName = monthNames[project.createdAt.getMonth()];
    if (velocityData[monthName]) {
      velocityData[monthName].created += 1;
      if (project.status === 'COMPLETED' || project.status === 'DONE') {
        velocityData[monthName].completed += 1;
      }
    }
  });

  // Convert object to sorted array for the frontend chart
  const chartData = Object.values(velocityData).reverse();

  return NextResponse.json({
    totalProjects,
    totalUsers,
    delayedProjects,
    systemEfficiency: "92%", 
    chartData, // This is your Line Chart data
  });
}