import { Student, TopicMastery, SubjectScore, TestResult } from '../types';

export const SUBJECTS = ['Math', 'Science', 'English', 'History', 'Computer Science', 'Physics'];

export const TOPIC_MAP: Record<string, string[]> = {
  Math: ['Linear Equations', 'Quadratic Functions', 'Trigonometry', 'Probability', 'Calculus Basics', 'Factoring'],
  Science: ['Cell Biology', 'Chemical Reactions', 'Newton\'s Laws', 'Ecosystems', 'Genetics', 'Periodic Table'],
  English: ['Essay Structure', 'Grammar Rules', 'Literary Analysis', 'Vocabulary', 'Reading Comprehension'],
  History: ['World War II', 'Industrial Revolution', 'Ancient Civilizations', 'Cold War', 'Constitution'],
  'Computer Science': ['Algorithms', 'Data Structures', 'OOP Concepts', 'Recursion', 'Sorting'],
  Physics: ['Kinematics', 'Forces', 'Energy & Work', 'Waves', 'Optics', 'Thermodynamics'],
};

function masteryLabel(score: number): 'Mastered' | 'Developing' | 'Needs Work' {
  if (score >= 80) return 'Mastered';
  if (score >= 55) return 'Developing';
  return 'Needs Work';
}

function genTopics(subjects: string[], baseScore: number): TopicMastery[] {
  const topics: TopicMastery[] = [];
  subjects.forEach(sub => {
    (TOPIC_MAP[sub] || []).forEach(topic => {
      const variance = Math.floor(Math.random() * 35) - 17;
      const mastery = Math.max(10, Math.min(100, baseScore + variance));
      topics.push({
        subject: sub,
        topic,
        mastery,
        label: masteryLabel(mastery),
        errorPattern: mastery < 55 ? `Repeated errors in ${topic.toLowerCase()} problems` : undefined,
      });
    });
  });
  return topics;
}

function genSubjectScores(baseScore: number): SubjectScore[] {
  return SUBJECTS.map(sub => {
    const score = Math.max(20, Math.min(100, baseScore + Math.floor(Math.random() * 30) - 15));
    return {
      subject: sub,
      score,
      classAvg: 68 + Math.floor(Math.random() * 10),
      trend: Array.from({ length: 4 }, () => Math.max(20, Math.min(100, score + Math.floor(Math.random() * 20) - 10))),
    };
  });
}

function genTestHistory(name: string): TestResult[] {
  const results: TestResult[] = [];
  SUBJECTS.slice(0, 4).forEach((sub, si) => {
    for (let t = 1; t <= 3; t++) {
      const score = Math.floor(40 + Math.random() * 55);
      results.push({
        testId: `${name}-${sub}-T${t}`,
        subject: sub,
        date: `2024-0${3 + si}-${10 + t * 5}`,
        score,
        maxScore: 100,
        topics: (TOPIC_MAP[sub] || []).slice(0, 2),
      });
    }
  });
  return results;
}

function computeRisk(score: number, att: number, assign: number): { label: 'LOW' | 'MED' | 'HIGH'; score: number } {
  const marksTrend = (100 - score) * 0.4;
  const attComponent = (100 - att) * 0.35;
  const assignComponent = (100 - assign) * 0.25;
  const risk = marksTrend + attComponent + assignComponent;
  if (risk >= 55) return { label: 'HIGH', score: risk };
  if (risk >= 35) return { label: 'MED', score: risk };
  return { label: 'LOW', score: risk };
}

export const SEED_STUDENTS: Omit<Student, 'id' | 'addedBy' | 'createdAt'>[] = [
  { name: 'Arjun Mehta', grade: '10A', score: 41, attendance: 62, assignments: 55 },
  { name: 'Sara Kapoor', grade: '10A', score: 53, attendance: 71, assignments: 70 },
  { name: 'Dev Patel', grade: '10B', score: 58, attendance: 78, assignments: 75 },
  { name: 'Nisha Reddy', grade: '10B', score: 65, attendance: 82, assignments: 80 },
  { name: 'Rohit Singh', grade: '11A', score: 72, attendance: 88, assignments: 85 },
  { name: 'Priya Sharma', grade: '11A', score: 79, attendance: 91, assignments: 90 },
  { name: 'Aditya Kumar', grade: '11B', score: 84, attendance: 94, assignments: 93 },
  { name: 'Meera Nair', grade: '11B', score: 88, attendance: 96, assignments: 95 },
  { name: 'Vikram Rao', grade: '12A', score: 45, attendance: 55, assignments: 48 },
  { name: 'Anjali Gupta', grade: '12A', score: 69, attendance: 85, assignments: 82 },
  { name: 'Sanjay Joshi', grade: '12B', score: 76, attendance: 89, assignments: 87 },
  { name: 'Pooja Verma', grade: '12B', score: 91, attendance: 98, assignments: 97 },
].map(s => {
  const risk = computeRisk(s.score, s.attendance, s.assignments);
  return {
    ...s,
    riskLevel: risk.label,
    riskScore: Math.round(risk.score),
    subjectScores: genSubjectScores(s.score),
    testHistory: genTestHistory(s.name),
    topicMastery: genTopics(SUBJECTS, s.score),
    missedClasses: s.attendance < 80
      ? ['Math (Mar 3)', 'Science (Mar 5)', 'English (Mar 10)', 'History (Mar 12)']
      : ['Math (Mar 15)'],
    pendingAssignments: Math.floor((100 - s.assignments) / 20),
    submittedAssignments: Math.floor(s.assignments / 12),
    lateAssignments: s.assignments < 70 ? 3 : 1,
  };
});

export const WEEKLY_ATTENDANCE = [
  { day: 'Mon', present: 238, absent: 10 },
  { day: 'Tue', present: 230, absent: 18 },
  { day: 'Wed', present: 241, absent: 7 },
  { day: 'Thu', present: 235, absent: 13 },
  { day: 'Fri', present: 218, absent: 30 },
];

export const CLASS_SUBJECT_GAPS = [
  { subject: 'Math', struggling: 47 },
  { subject: 'Physics', struggling: 38 },
  { subject: 'Science', struggling: 29 },
  { subject: 'English', struggling: 21 },
  { subject: 'History', struggling: 18 },
  { subject: 'CS', struggling: 12 },
];
