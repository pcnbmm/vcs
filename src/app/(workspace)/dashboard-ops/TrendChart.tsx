'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface TrendData {
  month: string;
  central: number;
  regional: number;
}

export default function TrendChart({ data }: { data: TrendData[] }) {
  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 600 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 600 }}
            dx={-10}
            allowDecimals={false}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', padding: '12px 20px', fontWeight: 'bold' }}
            cursor={{ stroke: '#e2e8f0', strokeWidth: 2, strokeDasharray: '5 5' }}
            labelStyle={{ color: '#475569', marginBottom: '8px' }}
          />
          <Legend 
            iconType="circle"
            wrapperStyle={{ paddingTop: '20px', fontWeight: 700, fontSize: '14px', color: '#475569' }}
          />
          <Line 
            type="monotone" 
            name="ส่วนกลาง"
            dataKey="central" 
            stroke="#8b5cf6" 
            strokeWidth={4}
            dot={{ r: 5, fill: '#fff', strokeWidth: 3 }}
            activeDot={{ r: 8, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 3 }}
          />
          <Line 
            type="monotone" 
            name="ส่วนภูมิภาค"
            dataKey="regional" 
            stroke="#14b8a6" 
            strokeWidth={4}
            dot={{ r: 5, fill: '#fff', strokeWidth: 3 }}
            activeDot={{ r: 8, fill: '#14b8a6', stroke: '#fff', strokeWidth: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
