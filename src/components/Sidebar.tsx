import { motion } from 'motion/react';
import {
  LayoutDashboard, Users, MessageSquare, LogOut, ChevronRight,
  GraduationCap, BookOpen, Calendar, Bell, FileText, TrendingUp,
  ClipboardList, Brain, Upload
} from 'lucide-react';
import { UserProfile } from '../types';
import { cn } from '../lib/utils';

interface SidebarProps {
  user: UserProfile;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const TEACHER_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'learning-gaps', label: 'Learning Gaps', icon: Brain },
  { id: 'attendance', label: 'Attendance', icon: Calendar },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
  { id: 'upload', label: 'Upload Data', icon: Upload },
];

const STUDENT_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'my-performance', label: 'My Performance', icon: TrendingUp },
  { id: 'learning-gaps', label: 'Learning Gaps', icon: Brain },
  { id: 'attendance', label: 'Attendance', icon: Calendar },
  { id: 'assignments', label: 'Assignments', icon: ClipboardList },
  { id: 'feedback', label: 'Feedback & AI', icon: MessageSquare },
  { id: 'exam', label: 'Exam', icon: BookOpen },
];

export default function Sidebar({ user, activeTab, setActiveTab, onLogout }: SidebarProps) {
  const isTeacher = user.role === 'teacher' || user.role === 'admin';
  const tabs = isTeacher ? TEACHER_TABS : STUDENT_TABS;

  return (
    <div className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r border-white/10 bg-[#050a12] p-4 z-40">
      <div className="mb-6 px-4 py-4">
        <h2 className="font-syne text-2xl font-extrabold text-white">
          Edu<span className="text-[#38bdf8]">Lens</span>
        </h2>
        <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-[#64748b]">
          {isTeacher ? 'Teacher Portal' : 'Student Portal'}
        </p>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "group flex w-full items-center justify-between rounded-xl px-4 py-2.5 transition-all",
              activeTab === item.id
                ? "bg-[#38bdf8] text-[#050a12]"
                : "text-[#64748b] hover:bg-white/5 hover:text-white"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon size={18} />
              <span className="font-syne text-sm font-bold">{item.label}</span>
            </div>
            {activeTab === item.id && <ChevronRight size={14} />}
          </button>
        ))}
      </div>

      <div className="mt-auto border-t border-white/10 pt-4">
        <div className="mb-3 flex items-center gap-3 px-4 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#38bdf8]/10 text-[#38bdf8] font-syne font-bold text-sm">
            {user.displayName.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="truncate font-syne text-sm font-bold text-white">{user.displayName}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#38bdf8]">{user.role}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[#f87171] transition-all hover:bg-[#f87171]/10"
        >
          <LogOut size={18} />
          <span className="font-syne text-sm font-bold">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
