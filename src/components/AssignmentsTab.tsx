import { motion } from 'motion/react';
import { ClipboardList, Clock, CheckCircle, AlertCircle, Plus, Loader } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Assignment, UserProfile } from '../types';
import { subscribeAssignments, addAssignment, updateAssignmentStatus } from '../lib/firebaseService';

interface Props { user?: UserProfile; }

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   icon: Clock,         color: 'text-[#fbbf24]', bg: 'bg-[#fbbf24]/10 border-[#fbbf24]/20' },
  submitted: { label: 'Submitted', icon: CheckCircle,   color: 'text-[#38bdf8]', bg: 'bg-[#38bdf8]/10 border-[#38bdf8]/20' },
  late:      { label: 'Late',      icon: AlertCircle,   color: 'text-[#f87171]', bg: 'bg-[#f87171]/10 border-[#f87171]/20' },
  graded:    { label: 'Graded',    icon: CheckCircle,   color: 'text-[#34d399]', bg: 'bg-[#34d399]/10 border-[#34d399]/20' },
};

export default function AssignmentsTab({ user }: Props) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'late' | 'graded'>('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeAssignments(user.uid, user.role, (data) => {
      setAssignments(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const filtered = assignments.filter(a => filter === 'all' || a.status === filter);
  const counts = {
    pending:   assignments.filter(a => a.status === 'pending').length,
    submitted: assignments.filter(a => a.status === 'submitted').length,
    late:      assignments.filter(a => a.status === 'late').length,
    graded:    assignments.filter(a => a.status === 'graded').length,
  };
  const completion = assignments.length > 0
    ? Math.round(((counts.submitted + counts.graded) / assignments.length) * 100)
    : 0;

  const handleSubmit = async (id: string) => {
    setSubmitting(id);
    await updateAssignmentStatus(id, 'submitted');
    setSubmitting(null);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <div className="flex items-center gap-2">
        <ClipboardList size={22} className="text-[#818cf8]" />
        <h2 className="font-syne text-3xl font-extrabold text-white">My <span className="text-[#38bdf8]">Assignments</span></h2>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Pending',    value: counts.pending,    color: 'text-[#fbbf24]' },
          { label: 'Submitted',  value: counts.submitted,  color: 'text-[#38bdf8]' },
          { label: 'Late',       value: counts.late,       color: 'text-[#f87171]' },
          { label: 'Completion', value: `${completion}%`,  color: 'text-[#34d399]' },
        ].map((k, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-[#0f1a2e] p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">{k.label}</p>
            <p className={`mt-2 font-syne text-3xl font-extrabold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0f1a2e] p-4">
        <div className="flex justify-between mb-2">
          <span className="font-syne text-sm font-bold text-white">Overall Completion</span>
          <span className="font-syne text-sm font-bold text-[#34d399]">{completion}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-[#38bdf8] to-[#34d399] transition-all duration-700" style={{ width: `${completion}%` }} />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'submitted', 'late', 'graded'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-xl px-4 py-2 font-syne text-xs font-bold transition-all capitalize ${
              filter === f ? 'bg-[#38bdf8] text-[#050a12]' : 'border border-white/10 bg-[#0f1a2e] text-[#64748b] hover:text-white'
            }`}>{f === 'all' ? 'All' : f}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader size={24} className="animate-spin text-[#38bdf8]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#0f1a2e] p-8 text-center">
          <ClipboardList size={32} className="mx-auto mb-3 text-[#64748b]" />
          <p className="font-syne text-white font-bold">No assignments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => {
            const cfg = STATUS_CONFIG[a.status];
            const Icon = cfg.icon;
            return (
              <motion.div key={a.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl border p-5 ${cfg.bg}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={16} className={cfg.color} />
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                      {a.grade !== undefined && a.grade !== null && (
                        <span className="ml-auto rounded-full bg-[#34d399]/10 px-2 py-0.5 text-[10px] font-bold text-[#34d399]">
                          {a.grade}%
                        </span>
                      )}
                    </div>
                    <p className="font-syne text-sm font-bold text-white">{a.title}</p>
                    <p className="font-instrument text-xs text-[#64748b]">{a.subject} · Due: {a.dueDate}</p>
                    {(a as any).feedback && <p className="mt-2 font-instrument text-xs text-[#94a3b8]">💬 {(a as any).feedback}</p>}
                  </div>
                  {a.status === 'pending' && user?.role === 'student' && (
                    <button onClick={() => handleSubmit(a.id)} disabled={submitting === a.id}
                      className="flex items-center gap-1 rounded-xl bg-[#38bdf8] px-4 py-2 font-syne text-xs font-bold text-[#050a12] hover:bg-[#7dd3fc] transition-all disabled:opacity-50">
                      {submitting === a.id ? <Loader size={12} className="animate-spin" /> : <Plus size={12} />}
                      Submit
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
