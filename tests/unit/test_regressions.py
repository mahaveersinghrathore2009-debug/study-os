"""Regression tests for bugs found in testing:

- /api/analytics/overview crashed (500) whenever an exam existed, because the
  Exam model had no `subject` relationship.
- Existing SQLite databases had study_sessions.subject_id NOT NULL; the schema
  migration must make it nullable without losing data (including recovery from
  an interrupted run).
- Focus/Pomodoro blocks are recorded via an atomic subject-less session log.
"""
import sqlite3
from datetime import date, datetime, timedelta

import pytest
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker

from app.database import Base, migrate_schema
from app.models import Exam, StudySession, Subject
from app.routers.analytics import overview
from app.routers.study import log_session
from app.schemas import SessionLog


@pytest.fixture
def db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine)()
    yield session
    session.close()


def _old_schema_sql() -> str:
    """study_sessions schema as it existed before subject_id became nullable."""
    return """
    CREATE TABLE subjects (
        id INTEGER NOT NULL PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        color VARCHAR(9), icon VARCHAR(40),
        weekly_goal_hours FLOAT, target_exam_date DATE, created_at DATETIME
    );
    CREATE TABLE study_sessions (
        id INTEGER NOT NULL PRIMARY KEY,
        subject_id INTEGER NOT NULL,
        topic_id INTEGER,
        started_at DATETIME NOT NULL,
        ended_at DATETIME,
        duration_seconds INTEGER NOT NULL,
        mood INTEGER, difficulty INTEGER, notes TEXT,
        status VARCHAR(16) NOT NULL,
        FOREIGN KEY(subject_id) REFERENCES subjects (id) ON DELETE CASCADE,
        FOREIGN KEY(topic_id) REFERENCES topics (id) ON DELETE SET NULL
    );
    CREATE INDEX ix_study_sessions_started_at ON study_sessions (started_at);
    CREATE TABLE exams (
        id INTEGER NOT NULL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        subject_id INTEGER,
        exam_date DATE NOT NULL,
        weight INTEGER, notes TEXT, created_at DATETIME
    );
    """


def _make_old_schema_db(path) -> None:
    con = sqlite3.connect(path)
    con.executescript(_old_schema_sql())
    con.execute("INSERT INTO subjects (id, name, color) VALUES (1, 'Physics', '#6366f1')")
    con.execute(
        "INSERT INTO study_sessions (id, subject_id, started_at, ended_at, duration_seconds, status) "
        "VALUES (1, 1, '2026-08-01 10:00:00', '2026-08-01 10:30:00', 1800, 'finished')"
    )
    con.execute(
        "INSERT INTO exams (id, title, subject_id, exam_date, weight) "
        "VALUES (1, 'Midterm', 1, '2026-10-01', 3), (2, 'Orals', NULL, '2026-11-01', 5)"
    )
    con.commit()
    con.close()


# ---------- analytics: exam without relationship used to crash ----------
def test_analytics_overview_with_exams(db):
    subj = Subject(name="Physics")
    db.add(subj)
    db.commit()
    start = datetime.utcnow() - timedelta(days=5)
    db.add(
        StudySession(
            subject_id=subj.id,
            started_at=start,
            ended_at=start + timedelta(minutes=30),
            duration_seconds=1800,
            status="finished",
        )
    )
    db.add(Exam(title="Midterm", subject_id=subj.id, exam_date=date.today() + timedelta(days=30), weight=3))
    db.add(Exam(title="Orals", subject_id=None, exam_date=date.today() + timedelta(days=60), weight=5))
    db.commit()

    out = overview(db)  # used to raise AttributeError: 'Exam' has no 'subject'
    assert len(out["exam_readiness"]) == 2
    by_title = {e["title"]: e for e in out["exam_readiness"]}
    assert by_title["Midterm"]["subject"] == "Physics"
    assert by_title["Midterm"]["readiness"] > 0
    assert by_title["Orals"]["subject"] is None
    assert out["streak"] >= 0


# ---------- subject-less / atomic session logging (Pomodoro) ----------
def test_log_session_without_subject(db):
    out = log_session(SessionLog(duration_seconds=1500, notes="Pomodoro focus"), db)
    assert out.subject_id is None
    assert out.duration_seconds == 1500
    assert out.status == "finished"
    assert out.ended_at is not None


def test_log_session_with_subject_and_start(db):
    subj = Subject(name="Math")
    db.add(subj)
    db.commit()
    start = datetime(2026, 8, 6, 10, 0, 0)
    out = log_session(
        SessionLog(subject_id=subj.id, duration_seconds=900, notes="Pomodoro focus", started_at=start),
        db,
    )
    assert out.subject_id == subj.id
    assert out.started_at == start
    assert out.ended_at == start + timedelta(seconds=900)


# ---------- schema migration ----------
def test_migrate_makes_subject_nullable_and_preserves_rows(tmp_path):
    db_path = tmp_path / "old.db"
    _make_old_schema_db(db_path)
    engine = create_engine(f"sqlite:///{db_path}")

    migrate_schema(engine)

    cols = {c["name"]: c for c in inspect(engine).get_columns("study_sessions")}
    assert cols["subject_id"]["nullable"] is True
    s = sessionmaker(bind=engine)()
    rows = s.query(StudySession).all()
    assert len(rows) == 1
    assert rows[0].subject_id == 1
    assert rows[0].duration_seconds == 1800
    s.close()

    # idempotent: a second run is a no-op and keeps the data
    migrate_schema(engine)
    s = sessionmaker(bind=engine)()
    assert len(s.query(StudySession).all()) == 1
    s.close()


def test_migrate_recovery_when_only_old_copy_remains(tmp_path):
    """Crash between RENAME and CREATE TABLE leaves only study_sessions_old."""
    db_path = tmp_path / "aborted.db"
    _make_old_schema_db(db_path)
    con = sqlite3.connect(db_path)
    con.executescript("ALTER TABLE study_sessions RENAME TO study_sessions_old")
    con.commit()
    con.close()
    engine = create_engine(f"sqlite:///{db_path}")

    migrate_schema(engine)

    names = set(inspect(engine).get_table_names())
    assert "study_sessions" in names
    assert "study_sessions_old" not in names
    cols = {c["name"]: c for c in inspect(engine).get_columns("study_sessions")}
    assert cols["subject_id"]["nullable"] is True
    s = sessionmaker(bind=engine)()
    rows = s.query(StudySession).all()
    assert len(rows) == 1
    assert rows[0].duration_seconds == 1800
    s.close()


def test_migrate_recovery_from_aborted_new_table(tmp_path):
    """Crash after CREATE TABLE leaves the new (empty) table plus the old copy."""
    db_path = tmp_path / "aborted2.db"
    _make_old_schema_db(db_path)
    con = sqlite3.connect(db_path)
    con.executescript(
        "ALTER TABLE study_sessions RENAME TO study_sessions_old;\n"
        "CREATE TABLE study_sessions ("
        " id INTEGER NOT NULL PRIMARY KEY, subject_id INTEGER, topic_id INTEGER,"
        " started_at DATETIME NOT NULL, ended_at DATETIME, duration_seconds INTEGER NOT NULL,"
        " mood INTEGER, difficulty INTEGER, notes TEXT, status VARCHAR(16) NOT NULL)"
    )
    con.commit()
    con.close()
    engine = create_engine(f"sqlite:///{db_path}")

    migrate_schema(engine)

    names = set(inspect(engine).get_table_names())
    assert "study_sessions_old" not in names
    s = sessionmaker(bind=engine)()
    rows = s.query(StudySession).all()
    assert len(rows) == 1
    assert rows[0].duration_seconds == 1800
    s.close()
