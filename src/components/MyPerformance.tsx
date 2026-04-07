import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { TrendingUp, Loader } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Student, UserProfile } from '../types';
import { subscribeStudents } from '../lib/firebaseService';

interface Props { user?: UserProfile; }

export default function MyPerformance({ user }: Props) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeStudents(data => { setStudents(data); setLoading(false); });
    return () => unsub();
  }, []);

  const demo = students.find(s =>
    s.name.toLowerCase().includes(user?.displayName?.split(' ')[0]?.toLowerCase() || '')
  ) || students[0];

  const subjectData = (demo?.subjectScores || []).map(s => ({
    subject: s.subject.slice(0, 6), myScore: s.score, classAvg: s.classAvg,
  }));

  const testTrend = (demo?.testHistory || []).map(t => ({
    label: `${t.subject.slice(0, 3)} T${t.testId.slice(-1)}`, score: t.score, subject: t.subject,
  }));

  const topicStats = {
    mastered:   (demo?.topicMastery || []).filter(t => t.label === 'Mastered').length,
    developing: (demo?.topicMastery || []).filter(t => t.label === 'Developing').length,
    needsWork:  (demo?.topicMastery || []).filter(t => t.label === 'Needs Work').length,
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp size={22} className="text-[#38bdf8]" />
        <h2 className="font-syne text-3xl font-extrabold text-white">My <span className="text-[#38bdf8]">Performance</span></h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader size={24} className="animate-spin text-[#38bdf8]" /></div>
      ) : !demo ? (
        <div className="rounded-2xl border border-white/10 bg-[#0f1a2e] p-8 text-center">
          <p className="font-syne text-white font-bold">No performance data yet</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Mastered Topics', value: topicStats.mastered, color: 'text-[#34d399]' },
              { label: 'Developing',      value: topicStats.developing, color: 'text-[#fbbf24]' },
              { label: 'Needs Work',      value: topicStats.needsWork, color: 'text-[#f87171]' },
            ].map((k, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-[#0f1a2e] p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">{k.label}</p>
                <p className={`mt-2 font-syne text-3xl font-extrabold ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0f1a2e] p-6">
            <h3 className="mb-4 font-syne text-lg font-bold text-white">Score History — All Tests</h3>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={testTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                  <Line type="monotone" dataKey="score" stroke="#38bdf8" strokeWidth={2.5} dot={{ fill: '#38bdf8', r: 3 }} name="Score" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0f1a2e] p-6">
            <h3 className="mb-4 font-syne text-lg font-bold text-white">My Score vs Class Average</h3>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="subject" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                  <Bar dataKey="myScore" fill="#38bdf8" fillOpacity={0.8} radius={[4, 4, 0, 0]} name="My Score" />
                  <Bar dataKey="classAvg" fill="#818cf8" fillOpacity={0.5} radius={[4, 4, 0, 0]} name="Class Avg" />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
