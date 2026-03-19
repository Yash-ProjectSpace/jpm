'use client';

import React, { useState } from 'react';
import { X, UserPlus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

// CHANGED: Added onSuccess to the destructured props and the TypeScript interface
export default function AddMemberModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: { 
  isOpen: boolean, 
  onClose: () => void,
  onSuccess: () => void 
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'Password123!', // Default temporary password
    role: 'EMPLOYEE',
    department: 'DX Promotion'
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        // CHANGED: Trigger the refresh function from the parent page
        onSuccess(); 
        // CHANGED: Clear the form so it's fresh for the next user
        setFormData({ name: '', email: '', password: 'Password123!', role: 'EMPLOYEE', department: 'DX Promotion' });
        onClose();
        router.refresh();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Error adding user");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <UserPlus size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-900">メンバー追加</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">氏名 (Name)</label>
            <input 
              required
              className="w-full mt-1.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="山田 太郎"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">メールアドレス (Email)</label>
            <input 
              required
              type="email"
              className="w-full mt-1.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="user@example.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">権限 (Role)</label>
              <select 
                className="w-full mt-1.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              >
                <option value="EMPLOYEE">EMPLOYEE</option>
                <option value="MANAGER">MANAGER</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">部署 (Dept)</label>
              <input 
                className="w-full mt-1.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Sales"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "ユーザーを作成する"}
          </button>
        </form>
      </div>
    </div>
  );
}