import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const data = [
  { name: 'Jan', preventive: 20, corrective: 5 },
  { name: 'Fév', preventive: 25, corrective: 8 },
  { name: 'Mar', preventive: 18, corrective: 12 },
  { name: 'Avr', preventive: 30, corrective: 6 },
  { name: 'Mai', preventive: 22, corrective: 9 },
  { name: 'Juin', preventive: 35, corrective: 4 },
];

const MaintenanceTrendsChart = () => {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
          />
          <Legend iconType="circle" />
          <Line 
            type="monotone" 
            dataKey="preventive" 
            name="Préventive" 
            stroke="#3b82f6" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#3b82f6' }} 
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="corrective" 
            name="Corrective" 
            stroke="#ef4444" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#ef4444' }} 
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MaintenanceTrendsChart;