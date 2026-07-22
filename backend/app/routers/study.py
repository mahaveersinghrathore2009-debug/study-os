from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import StudySession, Subject, Topic
from ..schemas import SessionFinish, SessionOut, SessionStart

router = APIRouter(prefix="/api", tags=["study"])


def _to_out(s: StudySession) -> SessionOut:
    return SessionOut(
        id=s.id,
        subject_id=s.subject_id,
        subject_name=s.subject.name if s.subject else None,
        topic_id=s.topic_id,
        topic_name=s.topic.name if s.topic else None,
        started_at=s.started_at,
        ended_at=s.ended_at,
        duration_seconds=s.duration_seconds,
        mood=s.mood,
        difficulty=s.difficulty,
        notes=s.notes,
        status=s.status,
    )


@router.post("/sessions/start", response_model=SessionOut)
def start_session(payload: SessionStart, db: Session = Depends(get_db)):
    if not db.get(Subject, payload.subject_id):
        raise HTTPException(404, "Subject not found")
    if payload.topic_id and not db.get(Topic, payload.topic_id):
        raise HTTPException(404, "Topic not found")
    # close any orphaned running session
    for s in db.query(StudySession).filter(StudySession.status == "running").all():
        s.status = "finished"
        s.ended_at = datetime.utcnow()
        s.duration_seconds = max(0, int((s.ended_at - s.started_at).total_seconds()))
    session = StudySession(
        subject_id=payload.subject_id,
        topic_id=payload.topic_id,
        started_at=datetime.utcnow(),
        status="running",
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return _to_out(session)


@router.post("/sessions/{session_id}/finish", response_model=SessionOut)
def finish_session(session_id: int, payload: SessionFinish, db: Session = Depends(get_db)):
    s = db.get(StudySession, session_id)
    if not s:
        raise HTTPException(404, "Session not found")
    ended = payload.ended_at or datetime.utcnow()
    s.ended_at = ended
    s.duration_seconds = payload.duration_seconds or max(0, int((ended - s.started_at).total_seconds()))
    s.mood = payload.mood
    s.difficulty = payload.difficulty
    s.notes = payload.notes
    s.status = "finished"
    db.commit()
    db.refresh(s)
    return _to_out(s)


@router.get("/sessions", response_model=list[SessionOut])
def list_sessions(
    limit: int = Query(50, ge=1, le=500),
    subject_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    q = db.query(StudySession).order_by(StudySession.started_at.desc())
    if subject_id:
        q = q.filter(StudySession.subject_id == subject_id)
    return [_to_out(s) for s in q.limit(limit).all()]


@router.delete("/sessions/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db)):
    s = db.get(StudySession, session_id)
    if not s:
        raise HTTPException(404, "Session not found")
    db.delete(s)
    db.commit()
    return {"ok": True}
