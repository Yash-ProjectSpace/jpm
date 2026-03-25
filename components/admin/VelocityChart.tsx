'use client';

import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

interface VelocityData {
  month: string;
  created: number;
  completed: number;
}

export default function VelocityChart({ data }: { data: VelocityData[] }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 w-full h-[400px]">
      <div className="mb-6">
        <h3 className="text-lg font-black text-slate-900 tracking-tight">プロジェクト・ベロシティ</h3>
        <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">
          新規作成 vs 完了済み (直近6ヶ月)
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
          />
          <Tooltip 
            contentStyle={{ 
              borderRadius: '1rem', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
            }}
          />
          <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
          
          {/* Created Projects - Indigo Line */}
          <Line 
            type="monotone" 
            dataKey="created" 
            name="新規作成" 
            stroke="#6366f1" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} 
            activeDot={{ r: 6 }} 
          />
          
          {/* Completed Projects - Emerald Line */}
          <Line 
            type="monotone" 
            dataKey="completed" 
            name="完了済み" 
            stroke="#10b981" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} 
            activeDot={{ r: 6 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}