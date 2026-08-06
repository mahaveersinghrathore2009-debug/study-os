from sqlalchemy import create_engine, event, inspect
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import settings

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},
)


@event.listens_for(engine, "connect")
def _enable_foreign_keys(dbapi_conn, _):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def migrate_schema(engine) -> None:
    """Idempotent, resumable structural migrations for existing SQLite databases.

    create_all() never alters existing tables, so changes that old databases
    need are applied here. Currently:
      - study_sessions.subject_id became nullable so Focus/Pomodoro blocks
        can be logged without picking a subject.

    SQLite DDL autocommits (legacy isolation), so an interrupted run can leave
    a renamed copy behind; each step is written to be safe to re-run.
    """
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())

    # A crash between RENAME and CREATE TABLE leaves only the renamed copy:
    # put it back, then let the rebuild below run on this very startup.
    if "study_sessions" not in tables:
        if "study_sessions_old" not in tables:
            return
        with engine.begin() as conn:
            conn.exec_driver_sql("ALTER TABLE study_sessions_old RENAME TO study_sessions")
        inspector = inspect(engine)
        tables = set(inspector.get_table_names())

    # A previous run may have aborted after creating the new (empty) table:
    # fold any rows left in the renamed copy back in.
    if "study_sessions_old" in tables:
        with engine.begin() as conn:
            conn.exec_driver_sql("DROP INDEX IF EXISTS ix_study_sessions_started_at")
            conn.exec_driver_sql(
                """
                INSERT INTO study_sessions
                    (id, subject_id, topic_id, started_at, ended_at,
                     duration_seconds, mood, difficulty, notes, status)
                SELECT id, subject_id, topic_id, started_at, ended_at,
                       duration_seconds, mood, difficulty, notes, status
                FROM study_sessions_old
                WHERE id NOT IN (SELECT id FROM study_sessions)
                """
            )
            conn.exec_driver_sql("DROP TABLE study_sessions_old")
            conn.exec_driver_sql(
                "CREATE INDEX IF NOT EXISTS ix_study_sessions_started_at ON study_sessions (started_at)"
            )
        return

    columns = {c["name"]: c for c in inspector.get_columns("study_sessions")}
    subj = columns.get("subject_id")
    if subj is not None and subj.get("nullable", False):
        return  # already migrated

    with engine.begin() as conn:
        conn.exec_driver_sql("DROP INDEX IF EXISTS ix_study_sessions_started_at")
        conn.exec_driver_sql("ALTER TABLE study_sessions RENAME TO study_sessions_old")
        conn.exec_driver_sql(
            """
            CREATE TABLE study_sessions (
                id INTEGER NOT NULL PRIMARY KEY,
                subject_id INTEGER,
                topic_id INTEGER,
                started_at DATETIME NOT NULL,
                ended_at DATETIME,
                duration_seconds INTEGER NOT NULL,
                mood INTEGER,
                difficulty INTEGER,
                notes TEXT,
                status VARCHAR(16) NOT NULL,
                FOREIGN KEY(subject_id) REFERENCES subjects (id) ON DELETE CASCADE,
                FOREIGN KEY(topic_id) REFERENCES topics (id) ON DELETE SET NULL
            )
            """
        )
        conn.exec_driver_sql(
            """
            INSERT INTO study_sessions
                (id, subject_id, topic_id, started_at, ended_at,
                 duration_seconds, mood, difficulty, notes, status)
            SELECT id, subject_id, topic_id, started_at, ended_at,
                   duration_seconds, mood, difficulty, notes, status
            FROM study_sessions_old
            """
        )
        conn.exec_driver_sql(
            "CREATE INDEX ix_study_sessions_started_at ON study_sessions (started_at)"
        )
        conn.exec_driver_sql("DROP TABLE study_sessions_old")


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
