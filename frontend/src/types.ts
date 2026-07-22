export interface Topic {
  id: number;
  subject_id: number;
  parent_id: number | null;
  name: string;
  notes?: string | null;
  mastery: number;
  difficulty: number;
  children: Topic[];
}

export interface Subject {
  id: number;
  name: string;
  color: string;
  icon?: string | null;
  weekly_goal_hours: number;
  target_exam_date?: string | null;
  topics: Topic[];
}

export interface Session {
  id: number;
  subject_id: number;
  subject_name?: string | null;
  topic_id?: number | null;
  topic_name?: string | null;
  started_at: string;
  ended_at?: string | null;
  duration_seconds: number;
  mood?: number | null;
  difficulty?: number | null;
  notes?: string | null;
  status: string;
}

export interface Goal {
  id: number;
  title: string;
  period: string;
  unit: string;
  target: number;
  subject_id?: number | null;
  progress: number;
  remaining: number;
}

export interface Exam {
  id: number;
  title: string;
  subject_id?: number | null;
  subject_name?: string | null;
  exam_date: string;
  weight: number;
  notes?: string | null;
  days_until?: number | null;
}

export interface Assignment {
  id: number;
  title: string;
  subject_id?: number | null;
  subject_name?: string | null;
  due_date: string;
  status: string;
  notes?: string | null;
}

export interface Note {
  id: number;
  title: string;
  content_md: string;
  subject_id?: number | null;
  topic_id?: number | null;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Flashcard {
  id: number;
  subject_id?: number | null;
  topic_id?: number | null;
  front: string;
  back: string;
  ease: number;
  interval_days: number;
  reviews: number;
  due_date: string;
}

export interface MoodEntry {
  id: number;
  entry_date: string;
  mood: number;
  energy: number;
  note?: string | null;
}

export interface JournalEntry {
  id: number;
  entry_date: string;
  content: string;
  updated_at: string;
}

export interface Settings {
  profile_name: string;
  theme: string;
  accent: string;
  font_scale: number;
  pomodoro_focus: number;
  pomodoro_break: number;
  pomodoro_long_break: number;
  daily_goal_hours: number;
  weekly_goal_hours: number;
  ollama_url: string;
  ollama_model: string;
  high_contrast: boolean;
}

export interface DashboardData {
  greeting_time: string;
  quote: string;
  today: { minutes: number; sessions: number; goal_hours: number };
  week: { minutes: number; goal_hours: number };
  streak: number;
  productivity_score: number;
  current_subject: { id: number; name: string; color: string } | null;
  upcoming_exams: { id: number; title: string; subject?: string | null; date: string; days_left: number }[];
  goals: { id: number; title: string; period: string; unit: string; target: number; progress: number }[];
  recommendation: { title: string; text: string };
}

export interface AnalyticsOverview {
  daily: { dates: string[]; minutes: number[] };
  weekly: { labels: string[]; minutes: number[] };
  monthly: { labels: string[]; minutes: number[] };
  subject_distribution: { name: string; color: string; minutes: number }[];
  heatmap: { date: string; minutes: number; level: number }[];
  streak: number;
  productivity_score: number;
  learning_curve: { labels: string[]; avg_length_min: number[]; sessions_per_day: number[] };
  productivity_trend: { labels: string[]; scores: number[] };
  burnout_trend: { date: string; risk: number }[];
  burnout_index: { risk: number; level: string; reasons: string[]; tip: string; total_hours: number };
  weak_topics: { topic_id: number; topic: string; subject: string; mastery: number; minutes: number; difficulty: number; score: number; reasons: string[] }[];
  exam_readiness: { exam_id: number; title: string; subject?: string | null; days_left: number; hours_needed: number; hours_studied: number; pace_hours_per_week: number; readiness: number }[];
}

export interface DNA {
  empty?: boolean;
  window_days: number;
  generated_at: string;
  best_hours?: { hour: number; minutes: number; avg_mood: number }[];
  ideal_length_min?: number;
  session_lengths?: Record<string, { count: number; avg_mood?: number | null }>;
  strongest_subjects?: { subject: string; minutes: number; avg_mastery: number }[];
  struggling_subjects?: { subject: string; minutes: number; avg_mastery: number }[];
  struggling_topics?: { topic_id: number; topic: string; subject: string; mastery: number; minutes: number; difficulty: number; score: number; reasons: string[] }[];
  learning_style?: { practice_lean: number; reading_lean: number; hint: string };
  burnout_pattern?: { recent_avg_risk: number; earlier_avg_risk: number; trending_up: boolean };
  revision_effectiveness?: number | null;
  summary?: string;
  ai_advice?: string;
}
