'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react'; 
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, FolderKanban, CheckSquare, 
  Users, Bell, BarChart3, LogOut, Command
} from 'lucide-react';

const menuItems = [
  { name: 'ダッシュボード', icon: LayoutDashboard, href: '/dashboard'},
  { name: 'プロジェクト', icon: FolderKanban, href: '/dashboard/projects'},
  { name: 'タスク管理', icon: CheckSquare, href: '/dashboard/tasks'},
  { name: 'メンバー', icon: Users, href: '/dashboard/members'},
  { name: 'レポート', icon: BarChart3, href: '/dashboard/reports'}, 
  { name: '掲示板', icon: Bell, href: '/dashboard/noticeboard'}, 
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen shrink-0 sticky top-0 font-sans">
      
      {/* --- PRO BRANDING --- */}
      <div className="h-16 flex items-center px-5 mt-2">
        {/* Changed this div to a Link pointing to /dashboard */}
        <Link href="/dashboard" className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-xs font-mono">JPM</span>
          </div>
          <div className="flex-1">
            <h1 className="text-sm font-bold text-slate-900 leading-none">JMCワークスペース</h1>
          </div>
        </Link>
      </div>
      
      {/* --- MAIN MENU --- */}
      <nav className="flex-1 px-3 mt-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`relative flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-bold transition-colors group ${
                isActive 
                ? 'text-slate-900' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {/* The Snappy Sliding Pill Background */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-slate-100 rounded-lg border border-slate-200/60"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }} 
                />
              )}

              <div className="relative z-10 flex items-center gap-3">
                <item.icon 
                  size={18} 
                  className={isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'} 
                />
                <span className="tracking-wide">{item.name}</span>
              </div>

              {/* Developer Shortcut Hint (e.g., ⌘ P) */}
              <div className="relative z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Command size={12} className="text-slate-400" />
                <span className="text-[10px] font-mono text-slate-400 font-bold"></span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* --- LOGOUT AREA --- */}
      <div className="p-3 mb-2 border-t border-slate-100">
        <button 
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors group mt-1"
        >
          <LogOut size={18} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
          <span>ログアウト</span>
        </button>
      </div>
    </div>
  );
}