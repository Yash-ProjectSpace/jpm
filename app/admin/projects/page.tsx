import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FolderKanban, Users, CheckCircle } from 'lucide-react';

export default async function AdminProjectsListPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/login');

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!currentUser || currentUser.role !== 'MANAGER') {
    redirect('/dashboard');
  }

  // Fetch ALL projects in the company
  const projects = await prisma.project.findMany({
    include: {
      members: true,
      tasks: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-8 max-w-[1600px] mx-auto w-full min-h-screen">
      <header className="mb-10 mt-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/20">
            <FolderKanban size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">全プロジェクト</h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Master Project List</p>
          </div>
        </div>
      </header>

      {projects.length === 0 ? (
        <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 text-center shadow-sm">
          <FolderKanban size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-black text-slate-700">プロジェクトがありません</h3>
          <p className="text-slate-500 text-sm mt-2">ユーザーダッシュボードからプロジェクトを作成してください。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map(project => (
            <Link key={project.id} href={`/admin/projects/${project.id}`}>
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-indigo-300 transition-all cursor-pointer group h-full flex flex-col">
                <div className="flex justify-between items-start mb-4 gap-4">
                  <h3 className="font-black text-lg text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {project.name}
                  </h3>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 tracking-wider shrink-0">
                    {project.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500 line-clamp-2 mb-6 flex-1">
                  {project.description || "説明なし (No description)"}
                </p>
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                    <Users size={14} />
                    <span>{project.members.length} Members</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                    <CheckCircle size={14} />
                    <span>{project.tasks.length} Tasks</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}