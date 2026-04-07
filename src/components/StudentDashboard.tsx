import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { UserProfile, Student } from '../types';
import { TrendingUp, BookOpen, Calendar, ClipboardList, Loader } from 'lucide-react';
import { subscribeStudents } from '../lib/firebaseService';

interface Props { user: UserProfile; }

export default function StudentDashboard({ user }: Props) {
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [students, setStudents] = useState<Student[]>([]);
  const [myData, setMyData] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const unsub = subscribeStudents(data => {
      setStudents(data);
      // Match by displayName
      const found = data.find(s => s.name.toLowerCase().includes(user.displayName?.split(' ')[0]?.toLowerCase() || '')) || data[0];
      setMyData(found || null);
      setLoading(false);
    });
    return () => unsub();
  }, [user.displayName]);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader size={32} className="animate-spin text-[#38bdf8]" />
    </div>
  );

  const demo = myData;
  const scoreHistory = (demo?.testHistory || []).filter(t => t.subject === 'Math').map(t => ({
    test: `${t.subject} T${t.testId.slice(-1)}`, score: t.score
  }));

  const radarData = (demo?.subjectScores || []).map(s => ({
    subject: s.subject.slice(0, 4), score: s.score, fullMark: 100
  }));

  const kpis = demo ? [
    { label: 'Overall Score', value: `${demo.score}%`, icon: TrendingUp, color: demo.score >= 70 ? 'text-[#34d399]' : demo.score >= 50 ? 'text-[#fbbf24]' : 'text-[#f87171]' },
    { label: 'Attendance',    value: `${demo.attendance}%`, icon: Calendar,     color: demo.attendance >= 80 ? 'text-[#34d399]' : 'text-[#f87171]' },
    { label: 'Assignments',   value: `${demo.assignments}%`, icon: ClipboardList, color: 'text-white' },
    { label: 'Risk Level',    value: demo.riskLevel,    icon: BookOpen,      color: demo.riskLevel === 'HIGH' ? 'text-[#f87171]' : demo.riskLevel === 'MED' ? 'text-[#fbbf24]' : 'text-[#34d399]' },
  ] : [];

  const weakTopics = (demo?.topicMastery || []).filter(t => t.label === 'Needs Work').slice(0, 3);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-syne text-3xl font-extrabold text-white">
            Hi, <span className="text-[#38bdf8]">{user.displayName}</span> 👋
          </h2>
          <p className="mt-1 font-instrument text-[#64748b]">Here's your live learning overview.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0f1a2e] px-4 py-2 text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Current Time</p>
          <p className="font-syne text-sm font-bold text-white">{time}</p>
        </div>
      </div>

      {!demo ? (
        <div className="rounded-2xl border border-white/10 bg-[#0f1a2e] p-8 text-center">
          <p className="font-syne text-white font-bold">No profile data yet</p>
          <p className="font-instrument text-sm text-[#64748b] mt-1">Ask your teacher to add your record to the system.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {kpis.map((kpi, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-white/10 bg-[#0f1a2e] p-5">
                <div className="flex items-center gap-2 mb-2">
                  <kpi.icon size={16} className="text-[#64748b]" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">{kpi.label}</p>
                </div>
                <p className={`font-syne text-2xl font-extrabold ${kpi.color}`}>{kpi.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-[#0f1a2e] p-6">
              <h3 className="mb-4 font-syne text-lg font-bold text-white">Score Trend (Math)</h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scoreHistory.length ? scoreHistory : [{ test: 'No data', score: 0 }]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="test" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                    <Line type="monotone" dataKey="score" stroke="#38bdf8" strokeWidth={2.5} dot={{ fill: '#38bdf8', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {radarData.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-[#0f1a2e] p-6">
                <h3 className="mb-4 font-syne text-lg font-bold text-white">Subject Radar</h3>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#1e293b" />
                      <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={11} />
                      <PolarRadiusAxis stroke="#64748b" fontSize={10} domain={[0, 100]} />
                      <Radar name="Score" dataKey="score" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.2} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {weakTopics.length > 0 && (
            <div className="rounded-2xl border border-[#f87171]/20 bg-[#0f1a2e] p-6">
              <h3 className="mb-4 font-syne text-lg font-bold text-white">⚠ Weak Topics to Focus On</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                {weakTopics.map((t, i) => (
                  <div key={i} className="rounded-xl border border-[#f87171]/20 bg-[#f87171]/5 p-4">
                    <p className="font-syne text-sm font-bold text-white">{t.topic}</p>
                    <p className="text-xs text-[#64748b]">{t.subject} · {t.mastery}% mastery</p>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-[#f87171]" style={{ width: `${t.mastery}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
