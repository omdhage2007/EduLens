import { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import Splash from './components/Splash';
import Login from './components/Login';
import Sidebar from './components/Sidebar';

// Teacher tabs
import TeacherDashboard from './components/TeacherDashboard';
import StudentTracker from './components/StudentTracker';
import LearningGaps from './components/LearningGaps';
import AttendanceTab from './components/AttendanceTab';
import AlertsTab from './components/AlertsTab';
import ReportsTab from './components/ReportsTab';
import AIChat from './components/AIChat';
import UploadData from './components/UploadData';
import RiskDetection from './components/RiskDetection';

// Student tabs
import StudentDashboard from './components/StudentDashboard';
import MyPerformance from './components/MyPerformance';
import AssignmentsTab from './components/AssignmentsTab';
import FeedbackTab from './components/FeedbackTab';
import ExamTab from './components/ExamTab';

import { UserProfile } from './types';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ ...userDoc.data(), uid: firebaseUser.uid } as UserProfile);
        } else {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'User',
            role: 'student',
            createdAt: null,
          });
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = (userData: UserProfile) => {
    setUser(userData);
    setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  const renderContent = () => {
    if (!user) return null;

    if (isTeacher) {
      switch (activeTab) {
        case 'dashboard':     return <TeacherDashboard key="t-dash"    user={user} />;
        case 'students':      return <StudentTracker   key="students"  user={user} />;
        case 'learning-gaps': return <LearningGaps     key="gaps"      user={user} isTeacher />;
        case 'attendance':    return <AttendanceTab    key="att"       user={user} isTeacher />;
        case 'alerts':        return <AlertsTab        key="alerts" />;
        case 'reports':       return <ReportsTab       key="reports"   user={user} />;
        case 'chat':          return <AIChat           key="chat" />;
        case 'upload':        return <UploadData       key="upload"    user={user} />;
        case 'risk':          return <RiskDetection    key="risk" />;
        default:              return <TeacherDashboard key="t-dash-d"  user={user} />;
      }
    } else {
      switch (activeTab) {
        case 'dashboard':      return <StudentDashboard key="s-dash"  user={user} />;
        case 'my-performance': return <MyPerformance   key="perf"     user={user} />;
        case 'learning-gaps':  return <LearningGaps    key="gaps"     user={user} isTeacher={false} />;
        case 'attendance':     return <AttendanceTab   key="s-att"    user={user} isTeacher={false} />;
        case 'assignments':    return <AssignmentsTab  key="assign"   user={user} />;
        case 'feedback':       return <FeedbackTab     key="feedback" />;
        case 'exam':           return <ExamTab         key="exam"     user={user} />;
        default:               return <StudentDashboard key="s-dash-d" user={user} />;
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050a12] text-white">
      <AnimatePresence mode="wait">
        {showSplash ? (
          <Splash key="splash" onComplete={() => setShowSplash(false)} />
        ) : !user ? (
          <Login key="login" onLogin={handleLogin} />
        ) : (
          <div key="app" className="flex">
            <Sidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
            <main className="ml-64 flex-1 p-8 min-h-screen">
              <AnimatePresence mode="wait">
                {renderContent()}
              </AnimatePresence>
            </main>
          </div>
        )}
      </AnimatePresence>
      <div id="toast-container" className="fixed bottom-8 right-8 z-[100] flex flex-col gap-2" />
    </div>
  );
}
