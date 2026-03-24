'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Users, 
  Bell, 
  LogOut,
  ClipboardCheck // Added this icon for Daily Reports
} from 'lucide-react';

const adminNavItems = [
  { name: 'ダッシュボード', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: '全プロジェクト', href: '/admin/projects', icon: FolderKanban },
  // SPLIT: We now have Daily Reports and Task Approvals as separate items
　{ name: '日報確認', href: '/admin/daily-reports', icon: ClipboardCheck },
  { name: 'メンバー管理', href: '/admin/members', icon: Users },
  { name: 'お知らせ配信', href: '/admin/notices', icon: Bell },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 shrink-0 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 border-r border-slate-800 shadow-2xl z-50">
      
      {/* Admin Logo Section */}
      <div className="h-24 flex items-center px-8 border-b border-slate-800 bg-slate-900 relative overflow-hidden shrink-0">
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-indigo-500 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/20">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">JPM</h1>
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">Manager Console</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
        <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Management</p>
        
        {adminNavItems.map((item) => {
          // Check if exactly active or if sub-page of the route is active
          const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname?.startsWith(`${item.href}/`));
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all group ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400 transition-colors'} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0">
        <button 
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all group"
        >
          <LogOut size={18} className="text-rose-500 group-hover:text-rose-400" />
          ログアウト
        </button>
      </div>
    </aside>
  );
}