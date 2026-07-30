from __future__ import annotations

import enum
from datetime import date, datetime, timezone
from typing import Optional


def utcnow() -> datetime:
    """Timezone-aware UTC now (utcnow() is deprecated in Python 3.12+)."""
    return datetime.now(timezone.utc)

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class GoalPeriod(str, enum.Enum):
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"
    yearly = "yearly"


class GoalUnit(str, enum.Enum):
    hours = "hours"
    sessions = "sessions"


class Subject(Base):
    __tablename__ = "subjects"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    color: Mapped[str] = mapped_column(String(9), default="#6366f1")
    icon: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    weekly_goal_hours: Mapped[float] = mapped_column(Float, default=4.0)
    target_exam_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    topics: Mapped[list[Topic]] = relationship(
        back_populates="subject", cascade="all, delete-orphan"
    )


class Topic(Base):
    __tablename__ = "topics"

    id: Mapped[int] = mapped_column(primary_key=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"))
    parent_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("topics.id", ondelete="CASCADE"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(160))
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    mastery: Mapped[float] = mapped_column(Float, default=0.0)  # 0.0 .. 1.0
    difficulty: Mapped[int] = mapped_column(Integer, default=3)  # 1..5
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    subject: Mapped[Subject] = relationship(back_populates="topics")
    parent: Mapped[Optional[Topic]] = relationship(
        remote_side=[id], backref="children"
    )


class StudySession(Base):
    __tablename__ = "study_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"))
    topic_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("topics.id", ondelete="SET NULL"), nullable=True
    )
    started_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0)
    mood: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 1..5
    difficulty: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 1..5
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(16), default="finished")  # running|finished

    subject: Mapped[Subject] = relationship()
    topic: Mapped[Optional[Topic]] = relationship()


class Goal(Base):
    __tablename__ = "goals"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    period: Mapped[str] = mapped_column(String(16), default="weekly")
    unit: Mapped[str] = mapped_column(String(16), default="hours")
    target: Mapped[float] = mapped_column(Float, default=4.0)
    subject_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("subjects.id", ondelete="CASCADE"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Exam(Base):
    __tablename__ = "exams"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    subject_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("subjects.id", ondelete="CASCADE"), nullable=True
    )
    exam_date: Mapped[date] = mapped_column(Date, index=True)
    weight: Mapped[int] = mapped_column(Integer, default=3)  # importance 1..5
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    subject_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("subjects.id", ondelete="CASCADE"), nullable=True
    )
    due_date: Mapped[date] = mapped_column(Date, index=True)
    status: Mapped[str] = mapped_column(String(16), default="pending")  # pending|done
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Note(Base):
    __tablename__ = "notes"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    content_md: Mapped[str] = mapped_column(Text, default="")
    subject_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True
    )
    topic_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("topics.id", ondelete="SET NULL"), nullable=True
    )
    pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utcnow, onupdate=utcnow
    )


class Flashcard(Base):
    __tablename__ = "flashcards"

    id: Mapped[int] = mapped_column(primary_key=True)
    subject_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True
    )
    topic_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("topics.id", ondelete="SET NULL"), nullable=True
    )
    front: Mapped[str] = mapped_column(Text)
    back: Mapped[str] = mapped_column(Text)
    ease: Mapped[float] = mapped_column(Float, default=2.5)  # SM-2 ease factor
    interval_days: Mapped[int] = mapped_column(Integer, default=0)
    reviews: Mapped[int] = mapped_column(Integer, default=0)
    due_date: Mapped[date] = mapped_column(Date, default=date.today, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    entry_date: Mapped[date] = mapped_column(Date, index=True, default=date.today)
    content: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utcnow, onupdate=utcnow
    )


class MoodEntry(Base):
    __tablename__ = "mood_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    entry_date: Mapped[date] = mapped_column(Date, index=True, default=date.today)
    mood: Mapped[int] = mapped_column(Integer, default=3)  # 1..5
    energy: Mapped[int] = mapped_column(Integer, default=3)  # 1..5
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class AIHistory(Base):
    __tablename__ = "ai_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    kind: Mapped[str] = mapped_column(String(32))
    prompt: Mapped[str] = mapped_column(Text, default="")
    response: Mapped[str] = mapped_column(Text, default="")
    model: Mapped[str] = mapped_column(String(64), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Setting(Base):
    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    value: Mapped[str] = mapped_column(Text, default="")
