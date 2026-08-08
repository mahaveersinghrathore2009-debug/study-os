from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Assignment, Exam, StudySession
from ..schemas import AssignmentCreate, AssignmentOut, ExamCreate, ExamOut

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


def _exam_out(e: Exam) -> ExamOut:
    return ExamOut(
        id=e.id, title=e.title, subject_id=e.subject_id,
        subject_name=e.subject.name if e.subject else None,
        exam_date=e.exam_date, weight=e.weight, notes=e.notes,
        days_until=(e.exam_date - date.today()).days,
    )


def _asg_out(a: Assignment) -> AssignmentOut:
    return AssignmentOut(
        id=a.id, title=a.title, subject_id=a.subject_id,
        subject_name=a.subject.name if a.subject else None,
        due_date=a.due_date, status=a.status, notes=a.notes,
    )


@router.get("/events")
def calendar_events(month: str = Query(..., pattern=r"^\d{4}-\d{2}$"), db: Session = Depends(get_db)):
    """Events grouped by day for a month: exams, assignments, study minutes."""
    year, mon = int(month[:4]), int(month[5:7])
    first = date(year, mon, 1)
    last = (date(year + 1, 1, 1) if mon == 12 else date(year, mon + 1, 1)) - timedelta(days=1)
    days: dict[str, list[dict]] = {}
    for d in range((last - first).days + 1):
        days[(first + timedelta(days=d)).isoformat()] = []
    for e in db.query(Exam).filter(Exam.exam_date >= first, Exam.exam_date <= last).all():
        days[e.exam_date.isoformat()].append({"kind": "exam", **{k: getattr(e, k) for k in ("id", "title", "weight")}, "subject": e.subject.name if e.subject else None})
    for a in db.query(Assignment).filter(Assignment.due_date >= first, Assignment.due_date <= last).all():
        days[a.due_date.isoformat()].append({"kind": "assignment", "id": a.id, "title": a.title, "status": a.status, "subject": a.subject.name if a.subject else None})
    rows = (
        db.query(StudySession)
        .filter(StudySession.status == "finished", StudySession.started_at >= datetime_compat(first), StudySession.started_at < datetime_compat(last + timedelta(days=1)))
        .all()
    )
    for s in rows:
        key = s.started_at.date().isoformat()
        days[key].append({"kind": "session", "id": s.id, "minutes": int(s.duration_seconds / 60), "subject": s.subject.name if s.subject else None})
    return {"days": days}


def datetime_compat(d: date):
    from datetime import datetime
    return datetime.combine(d, datetime.min.time())


@router.get("/exams", response_model=list[ExamOut])
def upcoming_exams(days: int = Query(30, ge=1, le=365), db: Session = Depends(get_db)):
    today = date.today()
    return [_exam_out(e) for e in db.query(Exam).filter(Exam.exam_date >= today, Exam.exam_date <= today + timedelta(days=days)).order_by(Exam.exam_date).all()]


@router.post("/exams", response_model=ExamOut)
def create_exam(payload: ExamCreate, db: Session = Depends(get_db)):
    exam = Exam(**payload.model_dump())
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return _exam_out(exam)


@router.delete("/exams/{exam_id}")
def delete_exam(exam_id: int, db: Session = Depends(get_db)):
    e = db.get(Exam, exam_id)
    if not e:
        raise HTTPException(404, "Exam not found")
    db.delete(e)
    db.commit()
    return {"ok": True}


@router.get("/assignments", response_model=list[AssignmentOut])
def upcoming_assignments(days: int = Query(30, ge=1, le=365), db: Session = Depends(get_db)):
    today = date.today()
    return [_asg_out(a) for a in db.query(Assignment).filter(Assignment.due_date >= today, Assignment.due_date <= today + timedelta(days=days)).order_by(Assignment.due_date).all()]


@router.post("/assignments", response_model=AssignmentOut)
def create_assignment(payload: AssignmentCreate, db: Session = Depends(get_db)):
    a = Assignment(**payload.model_dump())
    db.add(a)
    db.commit()
    db.refresh(a)
    return _asg_out(a)


@router.patch("/assignments/{assignment_id}", response_model=AssignmentOut)
def update_assignment(assignment_id: int, payload: AssignmentCreate, db: Session = Depends(get_db)):
    a = db.get(Assignment, assignment_id)
    if not a:
        raise HTTPException(404, "Assignment not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(a, k, v)
    db.commit()
    db.refresh(a)
    return _asg_out(a)


@router.delete("/assignments/{assignment_id}")
def delete_assignment(assignment_id: int, db: Session = Depends(get_db)):
    a = db.get(Assignment, assignment_id)
    if not a:
        raise HTTPException(404, "Assignment not found")
    db.delete(a)
    db.commit()
    return {"ok": True}
