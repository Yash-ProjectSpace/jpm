'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  Bell, 
  LogOut,
  ClipboardCheck
} from 'lucide-react';

const adminNavItems = [
  { name: 'ダッシュボード', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: '全プロジェクト', href: '/admin/projects', icon: FolderKanban },
  { name: '日報確認', href: '/admin/daily-reports', icon: ClipboardCheck },
  { name: 'メンバー管理', href: '/admin/members', icon: Users },
  { name: 'お知らせ配信', href: '/admin/notices', icon: Bell },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[250px] shrink-0 bg-white flex flex-col h-screen sticky top-0 border-r border-slate-100 z-50">
      
      {/* Admin Logo Section */}
      <div className="h-20 flex items-center px-6 border-b border-slate-50 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-sm">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">JPM</h1>
            <p className="text-[8px] font-black text-indigo-500 uppercase tracking-[0.2em]">マネージャーページ</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Management</p>
        
        {adminNavItems.map((item) => {
          // Precise path matching
          const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname?.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors duration-200 ${
                isActive 
                  ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100/50' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon size={18} className={`${
                isActive ? 'text-indigo-600' : 'text-slate-400'
              } transition-colors`} />
              
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-slate-50 bg-white shrink-0">
        <button 
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors duration-200 group"
        >
          <LogOut size={18} className="text-slate-400 group-hover:text-rose-500 transition-colors" />
          ログアウト
        </button>
      </div>
    </aside>
  );
}