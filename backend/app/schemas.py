from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- Subjects / Topics ----------
class TopicCreate(BaseModel):
    subject_id: int
    parent_id: Optional[int] = None
    name: str = Field(min_length=1, max_length=160)
    notes: Optional[str] = None
    mastery: float = Field(0.0, ge=0.0, le=1.0)
    difficulty: int = Field(3, ge=1, le=5)


class TopicOut(ORMModel):
    id: int
    subject_id: int
    parent_id: Optional[int]
    name: str
    notes: Optional[str]
    mastery: float
    difficulty: int
    children: list["TopicOut"] = []


class SubjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    color: str = "#6366f1"
    icon: Optional[str] = None
    weekly_goal_hours: float = Field(4.0, ge=0)
    target_exam_date: Optional[date] = None


class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    weekly_goal_hours: Optional[float] = None
    target_exam_date: Optional[date] = None


class SubjectOut(ORMModel):
    id: int
    name: str
    color: str
    icon: Optional[str]
    weekly_goal_hours: float
    target_exam_date: Optional[date]
    created_at: datetime
    topics: list[TopicOut] = []


class SubjectTree(BaseModel):
    id: int
    name: str
    color: str
    icon: Optional[str]
    weekly_goal_hours: float
    target_exam_date: Optional[date]
    topics: list[TopicOut] = []


# ---------- Study sessions ----------
class SessionStart(BaseModel):
    subject_id: int
    topic_id: Optional[int] = None


class SessionFinish(BaseModel):
    duration_seconds: Optional[int] = Field(None, ge=0)
    mood: Optional[int] = Field(None, ge=1, le=5)
    difficulty: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None
    ended_at: Optional[datetime] = None


class SessionOut(ORMModel):
    id: int
    subject_id: int
    subject_name: Optional[str] = None
    topic_id: Optional[int]
    topic_name: Optional[str] = None
    started_at: datetime
    ended_at: Optional[datetime]
    duration_seconds: int
    mood: Optional[int]
    difficulty: Optional[int]
    notes: Optional[str]
    status: str


# ---------- Goals ----------
class GoalCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    period: str = "weekly"
    unit: str = "hours"
    target: float = Field(4.0, gt=0)
    subject_id: Optional[int] = None


class GoalOut(ORMModel):
    id: int
    title: str
    period: str
    unit: str
    target: float
    subject_id: Optional[int]
    progress: float = 0.0
    remaining: float = 0.0


# ---------- Exams / Assignments ----------
class ExamCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    subject_id: Optional[int] = None
    exam_date: date
    weight: int = Field(3, ge=1, le=5)
    notes: Optional[str] = None


class ExamOut(ORMModel):
    id: int
    title: str
    subject_id: Optional[int]
    subject_name: Optional[str] = None
    exam_date: date
    weight: int
    notes: Optional[str]
    days_until: Optional[int] = None


class AssignmentCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    subject_id: Optional[int] = None
    due_date: date
    status: str = "pending"
    notes: Optional[str] = None


class AssignmentOut(ORMModel):
    id: int
    title: str
    subject_id: Optional[int]
    subject_name: Optional[str] = None
    due_date: date
    status: str
    notes: Optional[str]


# ---------- Notes ----------
class NoteCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content_md: str = ""
    subject_id: Optional[int] = None
    topic_id: Optional[int] = None
    pinned: bool = False


class NoteOut(ORMModel):
    id: int
    title: str
    content_md: str
    subject_id: Optional[int]
    topic_id: Optional[int]
    pinned: bool
    created_at: datetime
    updated_at: datetime


# ---------- Flashcards ----------
class FlashcardCreate(BaseModel):
    subject_id: Optional[int] = None
    topic_id: Optional[int] = None
    front: str = Field(min_length=1)
    back: str = Field(min_length=1)


class FlashcardOut(ORMModel):
    id: int
    subject_id: Optional[int]
    topic_id: Optional[int]
    front: str
    back: str
    ease: float
    interval_days: int
    reviews: int
    due_date: date


class FlashcardReview(BaseModel):
    rating: str = Field(pattern="^(again|good|easy)$")


# ---------- Mood / Journal ----------
class MoodCreate(BaseModel):
    entry_date: date
    mood: int = Field(ge=1, le=5)
    energy: int = Field(3, ge=1, le=5)
    note: Optional[str] = None


class MoodOut(ORMModel):
    id: int
    entry_date: date
    mood: int
    energy: int
    note: Optional[str]


class JournalCreate(BaseModel):
    entry_date: date
    content: str


class JournalOut(ORMModel):
    id: int
    entry_date: date
    content: str
    updated_at: datetime


# ---------- Settings ----------
class SettingsOut(BaseModel):
    profile_name: str = "Student"
    theme: str = "dark"
    accent: str = "indigo"
    font_scale: float = 1.0
    pomodoro_focus: int = 25
    pomodoro_break: int = 5
    pomodoro_long_break: int = 15
    daily_goal_hours: float = 2.0
    weekly_goal_hours: float = 14.0
    ollama_url: str = "http://127.0.0.1:11434"
    ollama_model: str = "qwen2.5:7b"
    high_contrast: bool = False


class SettingsUpdate(BaseModel):
    profile_name: Optional[str] = None
    theme: Optional[str] = None
    accent: Optional[str] = None
    font_scale: Optional[float] = None
    pomodoro_focus: Optional[int] = None
    pomodoro_break: Optional[int] = None
    pomodoro_long_break: Optional[int] = None
    daily_goal_hours: Optional[float] = None
    weekly_goal_hours: Optional[float] = None
    ollama_url: Optional[str] = None
    ollama_model: Optional[str] = None
    high_contrast: Optional[bool] = None


# ---------- AI ----------
class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    history: list[dict] = []


class SummarizeRequest(BaseModel):
    text: str = Field(min_length=1)


class QuizRequest(BaseModel):
    topic: str = Field(min_length=1)
    count: int = Field(5, ge=1, le=15)
    kind: str = "mcq"


class PlanRequest(BaseModel):
    date: Optional[date] = None
    available_hours: Optional[float] = None
