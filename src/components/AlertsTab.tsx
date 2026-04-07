import { motion } from 'motion/react';
import { Bell, Mail, MessageSquare, Filter, Trash2, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Alert, Student } from '../types';
import { subscribeAlerts, deleteAlert, generateAlertsFromStudents, subscribeStudents } from '../lib/firebaseService';

const TYPE_COLOR = {
  risk: 'text-[#f87171] bg-[#f87171]/10 border-[#f87171]/20',
  attendance: 'text-[#fbbf24] bg-[#fbbf24]/10 border-[#fbbf24]/20',
  performance: 'text-[#818cf8] bg-[#818cf8]/10 border-[#818cf8]/20',
};
const SEV_COLOR = {
  high: 'bg-[#f87171]/10 text-[#f87171]',
  medium: 'bg-[#fbbf24]/10 text-[#fbbf24]',
  low: 'bg-[#34d399]/10 text-[#34d399]',
};

export default function AlertsTab() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filter, setFilter] = useState<'all' | 'risk' | 'attendance' | 'performance'>('all');
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsub1 = subscribeAlerts(setAlerts);
    const unsub2 = subscribeStudents(setStudents);
    return () => { unsub1(); unsub2(); };
  }, []);

  const filtered = alerts.filter(a => filter === 'all' || a.type === filter);

  const handleSend = (id: string) => setSent(prev => new Set([...prev, id]));

  const handleDelete = async (id: string) => {
    await deleteAlert(id);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await generateAlertsFromStudents(students);
    setRefreshing(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Bell size={22} className="text-[#fbbf24]" />
          <h2 className="font-syne text-3xl font-extrabold text-white">Alerts & <span className="text-[#38bdf8]">Notifications</span></h2>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0f1a2e] px-4 py-2 font-syne text-xs font-bold text-white hover:border-[#38bdf8]/30 transition-all disabled:opacity-50">
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh Alerts
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'High Priority', value: alerts.filter(a => a.severity === 'high').length, color: 'text-[#f87171]' },
          { label: 'Medium Priority', value: alerts.filter(a => a.severity === 'medium').length, color: 'text-[#fbbf24]' },
          { label: 'Total Alerts', value: alerts.length, color: 'text-white' },
        ].map((k, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-[#0f1a2e] p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">{k.label}</p>
            <p className={`mt-2 font-syne text-3xl font-extrabold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'risk', 'attendance', 'performance'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-xl px-4 py-2 font-syne text-xs font-bold transition-all capitalize ${
              filter === f ? 'bg-[#38bdf8] text-[#050a12]' : 'border border-white/10 bg-[#0f1a2e] text-[#64748b] hover:text-white'
            }`}>{f === 'all' ? 'All Alerts' : f}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#0f1a2e] p-8 text-center">
          <Bell size={32} className="mx-auto mb-3 text-[#64748b]" />
          <p className="font-syne text-white font-bold">No alerts</p>
          <p className="font-instrument text-sm text-[#64748b] mt-1">All clear! No alerts in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(alert => (
            <motion.div key={alert.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className={`rounded-2xl border p-5 ${TYPE_COLOR[alert.type]}`}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-syne text-sm font-extrabold text-white">{alert.studentName}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${SEV_COLOR[alert.severity]}`}>{alert.severity}</span>
                    <span className="rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize opacity-70">{alert.type}</span>
                  </div>
                  <p className="font-instrument text-sm opacity-80">{alert.message}</p>
                  <p className="mt-1 text-[10px] opacity-50">{new Date(alert.timestamp).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {sent.has(alert.id) ? (
                    <span className="rounded-xl border border-[#34d399]/30 bg-[#34d399]/10 px-3 py-1.5 text-xs font-bold text-[#34d399]">Sent ✓</span>
                  ) : (
                    <>
                      <button onClick={() => handleSend(alert.id)}
                        className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#0b1220] px-3 py-1.5 text-xs font-bold text-white hover:border-[#38bdf8]/30 transition-all">
                        <Mail size={12} /> Email
                      </button>
                      <button onClick={() => handleSend(alert.id)}
                        className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#0b1220] px-3 py-1.5 text-xs font-bold text-white hover:border-[#38bdf8]/30 transition-all">
                        <MessageSquare size={12} /> SMS
                      </button>
                    </>
                  )}
                  <button onClick={() => handleDelete(alert.id)}
                    className="rounded-xl border border-[#f87171]/20 bg-[#f87171]/5 p-2 text-[#f87171] hover:bg-[#f87171]/10 transition-all">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#0f1a2e] p-5">
          <h3 className="font-syne text-sm font-bold text-white mb-3">Bulk Actions</h3>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => filtered.forEach(a => handleSend(a.id))}
              className="flex items-center gap-2 rounded-xl bg-[#38bdf8] px-4 py-2 font-syne text-xs font-bold text-[#050a12] hover:bg-[#7dd3fc] transition-all">
              <Mail size={14} /> Send All Emails
            </button>
            <button onClick={() => filtered.forEach(a => handleSend(a.id))}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b1220] px-4 py-2 font-syne text-xs font-bold text-white hover:border-[#38bdf8]/30 transition-all">
              <MessageSquare size={14} /> SMS All Parents
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
