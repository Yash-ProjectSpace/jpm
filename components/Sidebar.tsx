'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react'; // Added for the logout logic
import { LayoutDashboard, FolderKanban, CheckSquare, Users, Bell, BarChart3 } from 'lucide-react';
const menuItems = [
  { name: 'ダッシュボード', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'プロジェクト', icon: FolderKanban, href: '/dashboard/projects' },
  { name: 'タスク管理', icon: CheckSquare, href: '/dashboard/tasks' },
  { name: 'メンバー', icon: Users, href: '/dashboard/members' },
  // FIXED: Added 'd' to dashboard
  { name: 'レポート', icon: BarChart3, href: '/dashboard/reports'}, 
  // FIXED: Added leading '/' to dashboard
  { name: '掲示板', icon: Bell, href: '/dashboard/noticeboard'}, 
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-indigo-600 tracking-tighter">JPM</h1>
        <p className="text-[10px] text-slate-400 font-medium">JMC Project Management</p>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                isActive 
                ? 'bg-indigo-50 text-indigo-600' 
                : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <item.icon size={20} />
              <span className="text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button 
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full text-left px-4 py-2 text-sm font-medium text-slate-500 hover:text-rose-600 transition-colors flex items-center gap-3"
        >
          {/* Added a simple logout icon for better UX */}
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          ログアウト
        </button>
      </div>
    </div>
  );
}