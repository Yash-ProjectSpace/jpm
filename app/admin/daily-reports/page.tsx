import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ClipboardCheck, Calendar, Filter, RotateCcw, User } from 'lucide-react';
import ReportReviewCard from '@/components/ReportReviewCard';
import Link from 'next/link';

// Forces Next.js to always read fresh URL params
export const dynamic = 'force-dynamic'; 

// 1. Update searchParams type to be a Promise (Next.js 15 requirement)
export default async function AdminDailyReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  // --- CRITICAL FIX: Await the searchParams before accessing properties! ---
  const resolvedSearchParams = await searchParams;

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/login');

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!currentUser || currentUser.role !== 'MANAGER') {
    redirect('/dashboard');
  }

  // 2. Extract the filters from the newly awaited URL params
  const userFilter = resolvedSearchParams.user;
  const dateFilter = resolvedSearchParams.date;

  // 3. Build the Prisma WHERE clause dynamically
  const whereClause: any = { taskId: null };

  if (userFilter) {
    whereClause.authorId = userFilter; // Filter by specific user
  }

  if (dateFilter) {
    // Create a 24-hour window for the selected date
    const startOfDay = new Date(`${dateFilter}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateFilter}T23:59:59.999Z`);
    whereClause.createdAt = {
      gte: startOfDay,
      lte: endOfDay
    };
  }

  // FETCH: All users (so we can populate the dropdown)
  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  // FETCH: Daily reports using our dynamic whereClause
  const dailyReports = await prisma.report.findMany({
    where: whereClause,
    include: {
      author: { select: { id: true, name: true, department: true } },
      comments: {
        include: { author: { select: { name: true, role: true } } },
        orderBy: { createdAt: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const inputClass = "bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all";

  return (
    <div className="p-8 max-w-[1200px] mx-auto w-full min-h-screen text-slate-900">
      
      <header className="mb-8 mt-4 flex justify-between items-end">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/20">
            <ClipboardCheck size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">日報確認</h1>
          </div>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">レポート総数</p>
          <p className="text-2xl font-black text-indigo-600">{dailyReports.length}</p>
        </div>
      </header>

      {/* --- Filter Bar --- */}
      <form method="GET" className="bg-slate-50 border border-slate-100 p-4 rounded-[2rem] mb-8 flex flex-wrap items-center gap-4 shadow-sm">
        
        {/* User Dropdown */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400"><User size={18} /></div>
          <select name="user" defaultValue={userFilter || ""} className={`flex-1 ${inputClass} appearance-none cursor-pointer`}>
            <option value="">すべてのユーザー</option>
            {allUsers.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        {/* Date Picker */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400"><Calendar size={18} /></div>
          <input 
            type="date" 
            name="date" 
            defaultValue={dateFilter || ""} 
            className={`flex-1 ${inputClass} cursor-pointer`}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button type="submit" className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-indigo-700 transition-all active:scale-95">
            <Filter size={16} />
            絞り込む
          </button>
          
          {/* Reset Button (Only shows if a filter is active) */}
          {(userFilter || dateFilter) && (
            <Link href="/admin/daily-reports" className="flex items-center gap-2 bg-white text-slate-500 border border-slate-200 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-100 hover:text-slate-700 transition-all active:scale-95 shadow-sm">
              <RotateCcw size={16} />
              リセット
            </Link>
          )}
        </div>
      </form>

      {/* Reports Grid */}
      {dailyReports.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border border-slate-200 text-center shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar size={32} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-700">条件に一致する日報はありません</h3>
          {(userFilter || dateFilter) && (
             <p className="text-sm text-slate-400 font-bold mt-2">別のユーザーや日付をお試しください。</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dailyReports.map(report => (
            <ReportReviewCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}