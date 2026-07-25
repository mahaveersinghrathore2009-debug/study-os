from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import analytics, ai_service
from ..database import get_db
from ..models import Exam, Goal, Setting, StudySession, Subject

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

QUOTES = [
    "The secret of getting ahead is getting started. — Mark Twain",
    "Don't watch the clock; do what it does. Keep going. — Sam Levenson",
    "Success is the sum of small efforts, repeated day in and day out. — Robert Collier",
    "It always seems impossible until it's done. — Nelson Mandela",
    "The expert in anything was once a beginner. — Helen Hayes",
    "Study while others are sleeping; work while others are loafing. — William A. Ward",
    "The beautiful thing about learning is that no one can take it away from you. — B.B. King",
    "Discipline is choosing between what you want now and what you want most. — Abraham Lincoln",
    "Push yourself, because no one else is going to do it for you.",
    "Motivation gets you going, but discipline keeps you growing.",
    "One hour of focused study beats three hours of distraction.",
    "Your future self is watching you right now through your memories.",
]


def _quote() -> str:
    return QUOTES[date.today().toordinal() % len(QUOTES)]


def _settings_map(db: Session) -> dict:
    return {s.key: s.value for s in db.query(Setting).all()}


@router.get("")
def dashboard(db: Session = Depends(get_db)):
    today = date.today()
    s_map = _settings_map(db)
    daily_goal = float(s_map.get("daily_goal_hours", 2.0))
    weekly_goal = float(s_map.get("weekly_goal_hours", 14.0))

    day_start = datetime.combine(today, datetime.min.time())
    today_sessions = (
        db.query(StudySession)
        .filter(StudySession.status == "finished", StudySession.started_at >= day_start)
        .all()
    )
    today_minutes = int(sum(s.duration_seconds for s in today_sessions) / 60)

    week_start = today - timedelta(days=today.weekday())
    week_sessions = (
        db.query(StudySession)
        .filter(StudySession.status == "finished", StudySession.started_at >= datetime.combine(week_start, datetime.min.time()))
        .all()
    )
    week_minutes = int(sum(s.duration_seconds for s in week_sessions) / 60)

    upcoming_exams = (
        db.query(Exam)
        .filter(Exam.exam_date >= today, Exam.exam_date <= today + timedelta(days=14))
        .order_by(Exam.exam_date)
        .all()
    )
    exams = [
        {
            "id": e.id,
            "title": e.title,
            "subject": e.subject.name if e.subject else None,
            "date": e.exam_date.isoformat(),
            "days_left": (e.exam_date - today).days,
        }
        for e in upcoming_exams
    ]

    # current subject = most-studied this week
    current_subject = None
    if week_sessions:
        by_subject: dict[int, int] = {}
        for s in week_sessions:
            by_subject[s.subject_id] = by_subject.get(s.subject_id, 0) + s.duration_seconds
        top_id = max(by_subject, key=by_subject.get)
        subj = db.get(Subject, top_id)
        if subj:
            current_subject = {"id": subj.id, "name": subj.name, "color": subj.color}

    goals = [
        {
            "id": g.id,
            "title": g.title,
            "period": g.period,
            "unit": g.unit,
            "target": g.target,
            "progress": min(1.0, analytics.progress_for(db, g.period, g.unit, g.subject_id)[0] / max(g.target, 0.001)),
        }
        for g in db.query(Goal).all()
    ]

    # deterministic AI recommendation (fast, offline-safe)
    recommendation = _recommend(db, today_minutes, week_minutes)

    return {
        "greeting_time": _greeting(),
        "quote": _quote(),
        "today": {"minutes": today_minutes, "sessions": len(today_sessions), "goal_hours": daily_goal},
        "week": {"minutes": week_minutes, "goal_hours": weekly_goal},
        "streak": analytics.study_streak(db),
        "productivity_score": analytics.productivity_score(db, weekly_goal),
        "current_subject": current_subject,
        "upcoming_exams": exams,
        "goals": goals,
        "recommendation": recommendation,
    }


def _greeting() -> str:
    h = datetime.now().hour
    if h < 5:
        return "Burning the midnight oil"
    if h < 12:
        return "Good morning"
    if h < 17:
        return "Good afternoon"
    return "Good evening"


def _recommend(db: Session, today_minutes: int, week_minutes: int) -> dict:
    wt = analytics.weak_topics(db, limit=1)
    burnout = analytics.burnout_index(db)
    if today_minutes >= 60:
        tip = "You've earned a break. Step away for 5-10 minutes before your next session."
        if burnout["risk"] >= 50:
            tip = "Your burnout risk is climbing. Consider wrapping up early today — rest is part of the plan."
    elif wt:
        tip = f"Tackle your weakest topic next: {wt[0]['topic']} ({wt[0]['subject']})."
    elif week_minutes < 30:
        tip = "Let's get today's first session going — 25 focused minutes is enough to start."
    else:
        tip = "Solid momentum. Review yesterday's notes for 10 minutes to lock them in."
    return {"title": "AI Recommendation", "text": tip}
