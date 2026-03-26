'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, ShieldCheck, Mail, Trash2, 
  Loader2, Search, AlertCircle 
} from 'lucide-react';

export default function AdminMembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/members');
      if (res.ok) {
        const data = await res.json();
        setMembers(Array.isArray(data) ? data : (data.members || []));
      }
    } catch (error) {
      console.error("メンバーの取得に失敗しました", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("このメンバーを削除してもよろしいですか？この操作は取り消せません。")) return;
    try {
      const res = await fetch(`/api/admin/members?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchMembers();
      } else {
        alert("削除に失敗しました。サーバーエラーです。");
      }
    } catch (error) {
      alert("削除に失敗しました");
    }
  };

  const filteredMembers = members.filter(m => 
    (m.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || 
    (m.email?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-[1200px] mx-auto w-full text-slate-900">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="flex items-center gap-2 shrink-0">
           <Users size={28} className="text-indigo-600" />
           <h1 className="text-2xl font-black tracking-tight">メンバー管理</h1>
        </div>

        {/* Search Bar */}
        <div className="relative w-64 group flex items-center">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center pointer-events-none z-10">
            <Search 
              className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" 
              size={18}
              style={{ marginLeft: '4px' }} 
            />
          </div>
          <input 
            type="text"
            placeholder="メンバーを検索..."
            style={{ paddingLeft: '4rem' }} 
            className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all text-slate-900"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Loading & Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMembers.map((member) => (
            <div 
              key={member.id} 
              className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 hover:border-indigo-200 active:scale-95 transition-all duration-300 ease-out flex flex-col items-center text-center relative overflow-hidden group"
            >
              {/* Avatar Section */}
              <div className="w-16 h-16 rounded-full bg-slate-50 mb-4 overflow-hidden border-2 border-slate-50 shadow-inner relative group-hover:border-indigo-100 transition-colors">
                <img 
                  src={member.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=f1f5f9&color=6366f1&bold=true`} 
                  alt={member.name} 
                  className="w-full h-full object-cover" 
                />
                {member.role === 'MANAGER' && (
                  <div className="absolute bottom-0 right-0 bg-indigo-600 text-white p-0.5 rounded-full border border-white shadow-sm">
                    <ShieldCheck size={10} />
                  </div>
                )}
              </div>

              {/* Name and Department */}
              <h3 className="text-sm font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{member.name}</h3>
              <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-tighter">
                {member.department || "部署未設定"}
              </p>
              
              {/* Role Badge */}
              <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest mb-4 transition-all
                ${member.role === 'MANAGER' ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100' : 'bg-slate-50 text-slate-400'}`}>
                {member.role === 'MANAGER' ? 'マネージャー' : '社員'}
              </div>

              {/* Email */}
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mb-6 truncate max-w-full">
                <Mail size={10} /> {member.email}
              </div>

              {/* Action Buttons */}
              <div className="w-full pt-4 border-t border-slate-50 mt-auto">
                <button 
                  onClick={() => handleDelete(member.id)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all text-[10px] font-black"
                >
                  <Trash2 size={14} /> このメンバーを削除
                </button>
              </div>
            </div>
          ))}
          
          {filteredMembers.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center opacity-30">
              <AlertCircle size={40} className="mb-2" />
              <p className="text-xs font-bold italic">該当するメンバーが見つかりません</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}