import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import ReportReviewCard from '@/components/ReportReviewCard';

export default async function AdminApprovalsPage() {
  // 1. Security Check
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/login');

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!currentUser || currentUser.role !== 'MANAGER') {
    redirect('/dashboard');
  }

  // 2. Fetch PENDING reports that are linked to TASKS
  const pendingApprovals = await prisma.report.findMany({
    where: { 
      status: 'PENDING',
      taskId: { not: null } // This filters out general Daily Reports
    },
    include: {
      author: { select: { name: true, department: true } },
      task: {
        include: {
          project: { select: { id: true, name: true } } // Fetch the project info too
        }
      }
    },
    orderBy: { createdAt: 'asc' } // Oldest first (Urgent!)
  });

  return (
    <div className="p-8 max-w-[1400px] mx-auto w-full min-h-screen">
      
      {/* Header Section */}
      <header className="mb-10 mt-4 flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500 rounded-xl text-white shadow-lg shadow-rose-500/20">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">タスク承認待ち</h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">
              Task & Project Completion Queue
            </p>
          </div>
        </div>

        {pendingApprovals.length > 0 && (
          <div className="bg-rose-50 border border-rose-100 px-4 py-2 rounded-xl flex items-center gap-2 text-rose-600 animate-pulse">
            <AlertCircle size={16} />
            <span className="text-xs font-black uppercase tracking-wider">
              {pendingApprovals.length} 件の未承認アクション
            </span>
          </div>
        )}
      </header>

      {/* Grid of Approval Cards */}
      {pendingApprovals.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border border-slate-200 text-center shadow-sm">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500">
            <CheckCircle2 size={40} />
          </div>
          <h3 className="text-xl font-black text-slate-700">承認待ちのタスクはありません</h3>
          <p className="text-slate-500 text-sm mt-2">
            すべての作業が完了、または承認済みです。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {pendingApprovals.map((report) => (
            <div key={report.id} className="relative">
              {/* This component handles the Feedback input and Approve/Reject buttons */}
              <ReportReviewCard report={report} />
              
              {/* Optional: Add a "Final Task" badge if you want to highlight Project Completion */}
              {report.task?.title.toLowerCase().includes('final') && (
                <div className="absolute -top-3 -right-3 bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg z-10 uppercase tracking-widest">
                  Project Finish!
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}