import sys
from datetime import datetime, timedelta
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

BACKEND = Path(__file__).resolve().parent.parent.parent / "backend"
sys.path.insert(0, str(BACKEND))

from app import analytics  # noqa: E402
from app.database import Base  # noqa: E402
from app.models import StudySession, Subject, Topic  # noqa: E402


@pytest.fixture
def db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine)()
    yield session
    session.close()


def _add_session(db, subject_id, topic_id, minutes, days_ago, mood=3):
    start = datetime.utcnow() - timedelta(days=days_ago)
    db.add(
        StudySession(
            subject_id=subject_id,
            topic_id=topic_id,
            started_at=start,
            ended_at=start + timedelta(minutes=minutes),
            duration_seconds=minutes * 60,
            mood=mood,
            status="finished",
        )
    )


def test_streak_empty(db):
    assert analytics.study_streak(db) == 0


def test_streak_counts_consecutive_days(db):
    subj = Subject(name="Math")
    db.add(subj)
    db.commit()
    for i in range(3):
        _add_session(db, subj.id, None, 30, i)
    db.commit()
    assert analytics.study_streak(db) == 3


def test_productivity_score_in_range(db):
    subj = Subject(name="Physics")
    db.add(subj)
    db.commit()
    for i in range(7):
        _add_session(db, subj.id, None, 120, i)
    db.commit()
    score = analytics.productivity_score(db, 14.0)
    assert 0 <= score <= 100
    assert score > 50


def test_learning_dna_empty(db):
    assert analytics.learning_dna(db)["empty"] is True


def test_learning_dna_builds_profile(db):
    subj = Subject(name="CS")
    db.add(subj)
    db.commit()
    topic = Topic(subject_id=subj.id, name="Algorithms", mastery=0.2, difficulty=4)
    db.add(topic)
    db.commit()
    for i in range(5):
        _add_session(db, subj.id, topic.id, 45, i)
    db.commit()
    dna = analytics.learning_dna(db)
    assert dna["empty"] is False
    assert dna["best_hours"]
    assert dna["ideal_length_min"] == 45
    assert dna["struggling_topics"]


def test_weak_topics_detects(db):
    subj = Subject(name="Bio")
    db.add(subj)
    db.commit()
    db.add(Topic(subject_id=subj.id, name="Genetics", mastery=0.1, difficulty=5))
    db.commit()
    weak = analytics.weak_topics(db)
    assert any(w["topic"] == "Genetics" for w in weak)


def test_burnout_index_shape(db):
    b = analytics.burnout_index(db)
    assert {"risk", "level", "tip"} <= set(b.keys())
    assert 0 <= b["risk"] <= 100


def test_daily_study_len(db):
    data = analytics.daily_study(db, 30)
    assert len(data["dates"]) == 30
    assert len(data["minutes"]) == 30


def test_weekly_totals_shape(db):
    data = analytics.weekly_totals(db, 8)
    assert len(data["labels"]) == 8
    assert len(data["minutes"]) == 8
    assert all(isinstance(m, int) and m >= 0 for m in data["minutes"])


def test_monthly_totals_shape(db):
    data = analytics.monthly_totals(db, 6)
    assert len(data["labels"]) == 6
    assert len(data["minutes"]) == 6


def test_learning_curve_shape(db):
    data = analytics.learning_curve(db, 8)
    assert len(data["labels"]) == 8
    assert len(data["avg_length_min"]) == 8
    assert len(data["sessions_per_day"]) == 8


def test_burnout_trend_shape(db):
    trend = analytics.burnout_trend(db, 14)
    assert len(trend) == 14
    assert all(0 <= t["risk"] <= 100 for t in trend)


def test_fk_ordered_tables_parents_before_children():
    """Regression: restore must insert parents before children."""
    from app.routers.backup import _fk_ordered_tables
    order = _fk_ordered_tables()
    assert order.index("subjects") < order.index("topics")
    assert order.index("subjects") < order.index("study_sessions")
    assert order.index("topics") < order.index("study_sessions")
    assert order.index("subjects") < order.index("flashcards")
    assert order.index("topics") < order.index("flashcards")
    assert order.index("subjects") < order.index("goals")
    assert order.index("subjects") < order.index("notes")
