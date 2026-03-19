'use client';

import React, { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';

// Added refreshData to the props interface
export default function MemberRow({ 
  user, 
  refreshData 
}: { 
  user: any, 
  refreshData: () => void 
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  // 1. Handle Role Change
  const handleRoleChange = async (newRole: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/members/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      
      if (res.ok) {
        // Instead of router.refresh, we call the parent's fetch function
        refreshData(); 
      } else {
        alert("権限の更新に失敗しました。");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  // 2. Handle User Deletion
  const handleDelete = async () => {
    if (!confirm(`${user.name}を削除してもよろしいですか？\n(Are you sure you want to delete this user?)`)) return;
    
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/members/${user.id}`, { 
        method: 'DELETE' 
      });

      if (res.ok) {
        refreshData(); // Refresh the list instantly
      } else {
        const data = await res.json();
        alert(data.error || "削除に失敗しました。");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <tr className="hover:bg-slate-50 transition-colors group">
      {/* Member Identity */}
      <td className="px-8 py-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black shrink-0 ${
            user.role === 'MANAGER' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
          }`}>
            {user.name?.charAt(0) || '?'}
          </div>
          <span className="font-bold text-slate-800 truncate max-w-[150px]">{user.name || 'No Name'}</span>
        </div>
      </td>

      {/* Email */}
      <td className="px-8 py-5 text-sm text-slate-500 font-medium text-center">
        {user.email}
      </td>

      {/* Department */}
      <td className="px-8 py-5 text-center">
        <span className="text-[10px] font-black px-2 py-1 bg-slate-100 text-slate-500 rounded uppercase tracking-wider">
          {user.department || 'General'}
        </span>
      </td>

      {/* Role Selection */}
      <td className="px-8 py-5 text-center">
        <div className="flex justify-center items-center">
          {isUpdating ? (
            <Loader2 className="animate-spin text-indigo-500" size={16} />
          ) : (
            <select 
              value={user.role}
              onChange={(e) => handleRoleChange(e.target.value)}
              disabled={isUpdating}
              className={`text-[10px] font-black py-1.5 px-3 rounded-lg border-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all ${
                user.role === 'MANAGER' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                  : 'bg-emerald-500 text-white shadow-md shadow-emerald-100'
              }`}
            >
              <option value="EMPLOYEE">EMPLOYEE</option>
              <option value="MANAGER">MANAGER</option>
            </select>
          )}
        </div>
      </td>

      {/* Actions */}
      <td className="px-8 py-5 text-right">
        <button 
          onClick={handleDelete}
          disabled={isUpdating}
          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-30"
          title="Delete User"
        >
          <Trash2 size={18} />
        </button>
      </td>
    </tr>
  );
}