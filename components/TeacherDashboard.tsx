import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend
} from 'recharts';
import { UserProfile, Student } from '../types';
import { CLASS_SUBJECT_GAPS, WEEKLY_ATTENDANCE } from '../lib/seedData';
import { Sparkles, AlertTriangle, Database, CheckCircle, Loader } from 'lucide-react';
import { subscribeStudents, seedDatabase, generateAlertsFromStudents } from '../lib/firebaseService';

interface Props { user: UserProfile; }

export default function TeacherDashboard({ user }: Props) {
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [students, setStudents] = useState<Student[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');

  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const unsub = subscribeStudents(setStudents);
    return () => unsub();
  }, []);

  const highRisk = students.filter(s => s.riskLevel === 'HIGH').length;
  const medRisk  = students.filter(s => s.riskLevel === 'MED').length;
  const avgScore = students.length ? Math.round(students.reduce((a, s) => a + s.score, 0) / students.length) : 0;
  const avgAtt   = students.length ? Math.round(students.reduce((a, s) => a + s.attendance, 0) / students.length) : 0;

  const kpis = [
    { label: 'Total Students', value: students.length.toString(), delta: 'Live from Firebase', color: 'text-white' },
    { label: 'High Risk',      value: highRisk.toString(), delta: `${medRisk} medium risk`, color: 'text-[#f87171]' },
    { label: 'Avg Score',      value: `${avgScore}%`, delta: 'All students', color: 'text-white' },
    { label: 'Attendance',     value: `${avgAtt}%`, delta: 'Class average', color: 'text-[#34d399]' },
  ];

  const insights = [
    `${highRisk} student${highRisk !== 1 ? 's' : ''} at HIGH risk — immediate intervention needed`,
    `Class average score: ${avgScore}% across ${students.length} students`,
    students.filter(s => s.attendance < 75).length > 0
      ? `${students.filter(s => s.attendance < 75).length} students below 75% attendance threshold`
      : 'All students above 75% attendance — great!',
    `${medRisk} students in medium-risk zone — monitor closely`,
    'Subject gap highest in Math & Physics — schedule revision sessions',
    'Top performers showing consistent 85%+ scores this term',
  ];

  const handleSeedDB = async () => {
    if (seeding) return;
    setSeeding(true);
    setSeedMsg('');
    try {
      const msg = await seedDatabase(user.uid);
      setSeedMsg('✅ ' + msg);
    } catch (e: any) {
      setSeedMsg('❌ Error: ' + e.message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-syne text-3xl font-extrabold text-white">
            Welcome back, <span className="text-[#38bdf8]">{user.displayName}</span> 👋
          </h2>
          <p className="mt-1 font-instrument text-[#64748b]">Live class overview — synced with Firebase.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={handleSeedDB} disabled={seeding}
            className="flex items-center gap-2 rounded-xl border border-[#38bdf8]/30 bg-[#38bdf8]/10 px-4 py-2 font-syne text-xs font-bold text-[#38bdf8] hover:bg-[#38bdf8]/20 transition-all disabled:opacity-50">
            {seeding ? <Loader size={14} className="animate-spin" /> : <Database size={14} />}
            {seeding ? 'Seeding...' : 'Seed Demo Data'}
          </button>
          {seedMsg && (
            <span className="flex items-center gap-1 text-xs font-instrument text-[#34d399]">
              <CheckCircle size={12} /> {seedMsg}
            </span>
          )}
          <div className="rounded-xl border border-white/10 bg-[#0f1a2e] px-4 py-2 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Current Time</p>
            <p className="font-syne text-sm font-bold text-white">{time}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="rounded-2xl border border-white/10 bg-[#0f1a2e] p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">{kpi.label}</p>
            <p className={`mt-2 font-syne text-3xl font-extrabold ${kpi.color}`}>{kpi.value}</p>
            <p className="mt-1 text-xs text-[#64748b]">{kpi.delta}</p>
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl border border-[#818cf8]/20 bg-[#0f1a2e] p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={18} className="text-[#818cf8]" />
          <h3 className="font-syne text-lg font-bold text-white">AI Quick Insights</h3>
          <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-[#34d399] border border-[#34d399]/30 rounded-full px-2 py-0.5">Live</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {insights.map((insight, i) => (
            <div key={i} className="flex items-start gap-2 rounded-xl border border-white/5 bg-white/5 p-3">
              <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#818cf8]" />
              <p className="font-instrument text-sm text-[#94a3b8]">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#0f1a2e] p-6">
          <h3 className="mb-4 font-syne text-lg font-bold text-white">Subject Learning Gaps</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CLASS_SUBJECT_GAPS} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="subject" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#0f1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                <Bar dataKey="struggling" radius={[0, 6, 6, 0]}>
                  {CLASS_SUBJECT_GAPS.map((_, i) => (
                    <Cell key={i} fill={i < 2 ? '#f87171' : i < 4 ? '#fbbf24' : '#34d399'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0f1a2e] p-6">
          <h3 className="mb-4 font-syne text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle size={18} className="text-[#f87171]" /> At-Risk Students
          </h3>
          {students.length === 0 ? (
            <p className="font-instrument text-sm text-[#64748b]">No data yet. Click "Seed Demo Data" above.</p>
          ) : (
            <div className="space-y-3">
              {students.filter(s => s.riskLevel !== 'LOW').sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0)).slice(0, 6).map((s, i) => (
                <div key={i} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-syne text-sm font-bold text-white">{s.name}</p>
                    <p className="text-xs text-[#64748b]">{s.grade} · Score: {s.score}%</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    s.riskLevel === 'HIGH' ? 'bg-[#f87171]/10 text-[#f87171]' : 'bg-[#fbbf24]/10 text-[#fbbf24]'
                  }`}>{s.riskLevel}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0f1a2e] p-6">
        <h3 className="mb-4 font-syne text-lg font-bold text-white">Weekly Attendance Pattern</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={WEEKLY_ATTENDANCE}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0f1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
              <Bar dataKey="present" fill="#34d399" fillOpacity={0.7} radius={[4, 4, 0, 0]} name="Present" />
              <Bar dataKey="absent" fill="#f87171" fillOpacity={0.7} radius={[4, 4, 0, 0]} name="Absent" />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
