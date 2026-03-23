'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, ShieldCheck, Mail, Trash2, 
  UserCog, Loader2, Search, AlertCircle 
} from 'lucide-react';

export default function AdminMembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/members');
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

  const handleUpdateRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'MANAGER' ? 'EMPLOYEE' : 'MANAGER';
    if (!confirm(`権限を ${newRole} に変更してもよろしいですか？`)) return;
    
    try {
      const res = await fetch('/api/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, role: newRole }),
      });
      if (res.ok) fetchMembers();
    } catch (error) {
      alert("権限の更新に失敗しました");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このメンバーを削除してもよろしいですか？この操作は取り消せません。")) return;
    try {
      const res = await fetch(`/api/members?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchMembers();
    } catch (error) {
      alert("削除に失敗しました");
    }
  };

  const filteredMembers = members.filter(m => 
    (m.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || 
    (m.email?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-[1200px] mx-auto w-full">
      
      {/* ヘッダーと検索バー */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <Users size={28} className="text-indigo-600" />
             <h1 className="text-2xl font-black text-slate-900 tracking-tight">メンバー管理</h1>
          </div>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text"
            placeholder="名前またはメールで検索..."
            className="w-full bg-white border border-slate-100 rounded-xl py-2.5 pl-11 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredMembers.map((member) => (
            <div 
              key={member.id} 
              className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden"
            >
              {/* アバター部分 - サイズを少し縮小 */}
              <div className="w-16 h-16 rounded-full bg-slate-50 mb-3 overflow-hidden border-2 border-slate-50 shadow-inner relative">
                <img 
                  src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=f1f5f9&color=6366f1&bold=true`} 
                  alt={member.name} 
                  className="w-full h-full object-cover" 
                />
                {member.role === 'MANAGER' && (
                  <div className="absolute bottom-0 right-0 bg-indigo-600 text-white p-0.5 rounded-full border border-white">
                    <ShieldCheck size={10} />
                  </div>
                )}
              </div>

              {/* 名前と役職 */}
              <h3 className="text-sm font-black text-slate-900 mb-1">{member.name}</h3>
              <div className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest mb-3
                ${member.role === 'MANAGER' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                {member.role}
              </div>

              {/* メールアドレス */}
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mb-6 truncate max-w-full">
                <Mail size={10} /> {member.email}
              </div>

              {/* アクションボタン - よりコンパクトに配置 */}
              <div className="w-full grid grid-cols-2 gap-2 pt-4 border-t border-slate-50">
                <button 
                  onClick={() => handleUpdateRole(member.id, member.role)}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all text-[9px] font-black"
                >
                  <UserCog size={12} /> 権限変更
                </button>
                <button 
                  onClick={() => handleDelete(member.id)}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all text-[9px] font-black"
                >
                  <Trash2 size={12} /> 削除
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