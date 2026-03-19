'use client';

import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Loader2 } from 'lucide-react';
import MemberRow from '@/components/MemberRow';
import AddMemberModal from '@/components/AddMemberModal';

export default function MembersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Function to fetch users from the API
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/members/list'); // We will create this simple GET API next
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="p-8 max-w-[1400px] mx-auto w-full min-h-screen">
      <header className="mb-10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg">
            <Users size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">メンバー管理</h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">User Access Control</p>
          </div>
        </div>
        
        {/* OPEN MODAL ON CLICK */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
        >
          <UserPlus size={18} />
          新規ユーザー招待
        </button>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm shadow-slate-200/50">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">メンバー</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">メールアドレス</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">部署</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">権限 (Role)</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-20 text-center">
                  <Loader2 className="animate-spin mx-auto text-indigo-500" size={32} />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-20 text-center text-slate-400 font-bold">
                  ユーザーが見つかりません
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <MemberRow key={user.id} user={user} refreshData={fetchUsers} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* THE MODAL COMPONENT */}
      <AddMemberModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchUsers} 
      />
    </div>
  );
}