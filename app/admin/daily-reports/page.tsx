import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ClipboardCheck, Calendar } from 'lucide-react';
import ReportReviewCard from '@/components/ReportReviewCard';

export default async function AdminDailyReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/login');

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!currentUser || currentUser.role !== 'MANAGER') {
    redirect('/dashboard');
  }

  // FETCH: All daily reports (where taskId is null)
  const dailyReports = await prisma.report.findMany({
    where: { taskId: null },
    include: {
      author: { select: { id: true, name: true, department: true } },
      comments: {
        include: { author: { select: { name: true, role: true } } },
        orderBy: { createdAt: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-8 max-w-[1200px] mx-auto w-full min-h-screen text-slate-900">
      <header className="mb-10 mt-4 flex justify-between items-end">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/20">
            <ClipboardCheck size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">日報確認</h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Team Daily Feed</p>
          </div>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Reports</p>
          <p className="text-2xl font-black text-indigo-600">{dailyReports.length}</p>
        </div>
      </header>

      {dailyReports.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border border-slate-200 text-center shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar size={32} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-700">本日の日報はまだありません</h3>
          <p className="text-slate-500 text-sm mt-2">No daily reports submitted yet.</p>
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