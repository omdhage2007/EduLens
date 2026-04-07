import { motion } from 'motion/react';
import { SEED_STUDENTS } from '../lib/seedData';
import { Shield, TrendingDown } from 'lucide-react';

function RiskBar({ value, label }: { value: number; label: string }) {
  const color = value >= 55 ? 'bg-[#f87171]' : value >= 35 ? 'bg-[#fbbf24]' : 'bg-[#34d399]';
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-xs text-[#64748b]">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <span className="w-10 text-right text-xs font-bold text-white">{Math.round(value)}</span>
    </div>
  );
}

export default function RiskDetection() {
  const sorted = [...SEED_STUDENTS].sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield size={22} className="text-[#f87171]" />
        <h2 className="font-syne text-3xl font-extrabold text-white">Risk <span className="text-[#38bdf8]">Detection</span></h2>
      </div>

      {/* Legend */}
      <div className="rounded-2xl border border-white/10 bg-[#0f1a2e] p-5">
        <h3 className="mb-3 font-syne text-sm font-bold text-white">Risk Scoring Formula</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'Marks Trend', weight: '40%', color: 'text-[#38bdf8]' },
            { label: 'Attendance', weight: '35%', color: 'text-[#818cf8]' },
            { label: 'Assignments', weight: '25%', color: 'text-[#34d399]' },
          ].map((w, i) => (
            <div key={i} className="rounded-xl border border-white/10 p-3">
              <p className={`font-syne text-xl font-extrabold ${w.color}`}>{w.weight}</p>
              <p className="text-xs text-[#64748b] mt-1">{w.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'High Risk', range: '≥ 55', color: 'text-[#f87171] bg-[#f87171]/10' },
            { label: 'Medium Risk', range: '40–69', color: 'text-[#fbbf24] bg-[#fbbf24]/10' },
            { label: 'Low Risk', range: '< 40', color: 'text-[#34d399] bg-[#34d399]/10' },
          ].map((r, i) => (
            <div key={i} className={`rounded-xl p-3 ${r.color}`}>
              <p className="font-syne text-sm font-bold">{r.label}</p>
              <p className="text-xs mt-0.5">{r.range}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Student Risk List */}
      <div className="rounded-2xl border border-white/10 bg-[#0f1a2e] p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown size={18} className="text-[#f87171]" />
          <h3 className="font-syne text-lg font-bold text-white">All Students — Risk Ranking</h3>
        </div>
        <div className="space-y-4">
          {sorted.map((s, i) => {
            const marksRisk = (100 - s.score) * 0.4;
            const attRisk = (100 - s.attendance) * 0.35;
            const assignRisk = (100 - s.assignments) * 0.25;
            return (
              <div key={i} className="rounded-xl border border-white/10 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-syne text-sm font-bold text-white">{s.name}</p>
                    <p className="text-xs text-[#64748b]">{s.grade} · Risk Score: {s.riskScore}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                    s.riskLevel === 'HIGH' ? 'bg-[#f87171]/10 text-[#f87171]' :
                    s.riskLevel === 'MED' ? 'bg-[#fbbf24]/10 text-[#fbbf24]' :
                    'bg-[#34d399]/10 text-[#34d399]'
                  }`}>{s.riskLevel} Risk</span>
                </div>
                <div className="space-y-1.5">
                  <RiskBar value={marksRisk} label="Marks (40%)" />
                  <RiskBar value={attRisk} label="Attendance (35%)" />
                  <RiskBar value={assignRisk} label="Assignments (25%)" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
