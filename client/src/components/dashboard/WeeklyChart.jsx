import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WeeklyChart({ data = [] }) {
  const chartData = data.map((d) => ({
    name: DAYS[new Date(d.date).getDay()],
    total: d.total,
    summaries: d.summaries,
  }));

  return (
    <div className="card p-5">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-bold">Study Overview</h3>
        <p className="text-2xs text-ink-soft">Last 7 days</p>
      </div>
      <p className="mb-3 text-xs text-ink-soft">Learning activity per day (summaries, flashcards, quizzes and chats)</p>
      {chartData.length === 0 || chartData.every((d) => d.total === 0) ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-line">
          <p className="text-xs font-semibold text-ink-soft">No activity yet this week</p>
          <p className="mt-1 text-2xs text-ink-soft/70">Generate a summary or start a quiz to see data here.</p>
        </div>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 6, right: 4, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAEAF1" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#77798C' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#77798C' }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(117,107,238,0.06)' }}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #EAEAF1',
                  fontSize: 12,
                  boxShadow: '0 4px 16px -4px rgb(32 33 55 / 0.12)',
                }}
              />
              <Bar dataKey="total" name="Study actions" fill="#756BEE" radius={[6, 6, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
