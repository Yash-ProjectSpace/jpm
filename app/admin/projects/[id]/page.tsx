import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FolderKanban, Calendar, Users, ArrowLeft, LayoutList } from 'lucide-react';

import ProjectChat from '@/components/ProjectChat';

// 1. FIX: In modern Next.js, params is a Promise, so we type it as such
export default async function AdminProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // 2. FIX: We must `await` the params to actually get the ID!
  const resolvedParams = await params;
  
  // Security Check & Get Current User ID
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/login');

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!currentUser || currentUser.role !== 'MANAGER') {
    redirect('/dashboard');
  }

  // 3. FIX: Now we safely use resolvedParams.id
  const project = await prisma.project.findUnique({
    where: { id: resolvedParams.id },
    include: {
      members: { select: { id: true, name: true, department: true } },
      tasks: true,
    }
  });

  // If someone types a bad URL, show an error
  if (!project) {
    return (
      <div className="p-8 max-w-[1600px] mx-auto w-full min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-black text-slate-800">プロジェクトが見つかりませんでした</h2>
          <Link href="/admin/projects" className="text-indigo-600 font-bold mt-4 inline-block hover:underline">
            ← ダッシュボードに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto w-full min-h-screen">
      
      {/* Back Button */}
      <Link href="/admin/projects" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-sm mb-6 transition-colors">
        <ArrowLeft size={16} />
        戻る 
      </Link>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600 border border-indigo-200 shadow-sm">
            <FolderKanban size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{project.name}</h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs font-black px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-700 tracking-wider">
                {project.status}
              </span>
              <p className="text-slate-400 text-xs font-bold flex items-center gap-1">
                <Calendar size={14} /> 
                {project.createdAt.toLocaleDateString('ja-JP')}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid: Details on Left, Chat on Right */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Project Details */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Description Card */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
            <h3 className="font-black text-slate-900 mb-4 uppercase tracking-widest text-xs flex items-center gap-2">
              <LayoutList size={16} className="text-indigo-500" />
              プロジェクト概要 
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              {project.description || "説明がありません (No description provided)."}
            </p>
          </div>

          {/* Members Card */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
            <h3 className="font-black text-slate-900 mb-6 uppercase tracking-widest text-xs flex items-center gap-2">
              <Users size={16} className="text-indigo-500" />
              アサインされたメンバー 
            </h3>
            
            {project.members.length === 0 ? (
              <p className="text-slate-400 text-sm italic">まだメンバーがアサインされていません。</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {project.members.map(member => (
                  <div key={member.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-indigo-200 text-indigo-700 font-black flex items-center justify-center shrink-0">
                      {member.name ? member.name.charAt(0) : '?'}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-800">{member.name}</p>
                      <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{member.department || 'MEMBER'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: The Live Chat! */}
        <div className="xl:col-span-1">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 sticky top-8">
            <h3 className="font-black text-slate-900 mb-4 uppercase tracking-widest text-xs flex items-center gap-2 px-2">
              💬 プロジェクトチャット 
            </h3>
            
            {/* HERE IS OUR COMPONENT */}
            <ProjectChat projectId={resolvedParams.id} currentUserId={currentUser.id} />
            
          </div>
        </div>

      </div>
    </div>
  );
}