'use client';

import React, { useState } from 'react';
import { Plus, MoreVertical, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

// Sample Data translated to Japanese
const initialProjects = [
  { id: 1, name: 'JMC インフラ拡張計画', status: '進行中', tasks: 12, completion: 65, priority: '高' },
  { id: 2, name: 'システムセキュリティ監査', status: '完了', tasks: 8, completion: 100, priority: '中' },
  { id: 3, name: '第3四半期 リソース計画', status: '保留中', tasks: 4, completion: 20, priority: '低' },
];

export default function ProjectsPage() {
  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">プロジェクト一覧</h1>
          <p className="text-slate-500 mt-1">JMCの全てのアクティブな計画を管理・追跡します。</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95">
          <Plus size={20} />
          新規プロジェクト
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {initialProjects.map((project) => (
          <div key={project.id} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg flex items-center gap-2 text-xs font-bold ${
                project.status === '完了' ? 'bg-emerald-50 text-emerald-600' : 
                project.status === '進行中' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
              }`}>
                {project.status === '完了' ? <CheckCircle2 size={18} /> : 
                 project.status === '進行中' ? <Clock size={18} /> : <AlertCircle size={18} /> }
                {project.status}
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                <MoreVertical size={20} />
              </button>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
              {project.name}
            </h3>
            
            <div className="flex items-center gap-2 mb-6">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                project.priority === '高' ? 'bg-rose-100 text-rose-600' : 
                project.priority === '中' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
              }`}>
                優先度：{project.priority}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-slate-500">進捗状況</span>
                <span className="text-slate-900">{project.completion}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full transition-all duration-500" 
                  style={{ width: `${project.completion}%` }}
                />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center text-sm font-medium text-slate-500">
              <div className="flex items-center gap-1">
                <CheckSquare size={16} />
                {project.tasks} 個のタスク
              </div>
              <div className="flex -space-x-2">
                {/* Visual placeholders for team members */}
                <div className="w-7 h-7 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-[10px] text-indigo-600 font-bold">担当</div>
                <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper component for the Icon
function CheckSquare({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
  );
}