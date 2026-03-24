'use client';

import React, { useState, useEffect } from 'react';
import { 
  Mail, ShieldCheck, Loader2
} from 'lucide-react';
import { useSession } from "next-auth/react"; 

export default function MembersPage() {
  const { data: session } = useSession(); 
  const [dbMembers, setDbMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchDatabaseMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/members');
      if (res.ok) {
        const data = await res.json();
        setDbMembers(Array.isArray(data) ? data : (data.members || []));
      }
    } catch (e) {
      console.error("DBメンバーの取得に失敗しました", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseMembers();
  }, []);

  return (
    <div className="p-8 bg-slate-50 min-h-screen relative">
      <header className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            チームメンバー <span className="text-indigo-600">({dbMembers.length})</span>
          </h1>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {dbMembers.map((member) => (
            <div 
              key={member.id} 
              // RESTORED: hover:shadow-xl and hover:-translate-y-1 for the floating card effect
              className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col items-center text-center"
            >
              {/* RESTORED: group-hover:scale-105 for the avatar zoom effect */}
              <div className="w-24 h-24 rounded-full bg-slate-50 mb-4 overflow-hidden border-4 border-slate-50 shadow-inner group-hover:scale-105 transition-transform duration-300 relative">
                <img 
                  src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=f1f5f9&color=6366f1&bold=true`} 
                  alt={member.name} 
                  className="w-full h-full object-cover" 
                />
                {member.role === 'MANAGER' && (
                  <div className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1.5 rounded-full border-2 border-white shadow-sm">
                    <ShieldCheck size={14} />
                  </div>
                )}
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-1">{member.name}</h3>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest mb-3 ${
                member.role === 'MANAGER' 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'bg-slate-50 text-slate-500'
              }`}>
                {member.role === 'MANAGER' ? 'マネージャー' : '一般社員'}
              </span>
              <p className="text-xs font-bold text-slate-500 flex items-center justify-center gap-1.5">
                <Mail size={12} /> {member.email}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}