from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import analytics
from ..database import get_db
from ..models import Exam, Setting, Subject

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def _exam_readiness(db: Session) -> list[dict]:
    """Approx readiness per upcoming exam from recent study in its subject."""
    out = []
    today = date.today()
    for e in db.query(Exam).filter(Exam.exam_date >= today).order_by(Exam.exam_date).all():
        days_left = max(1, (e.exam_date - today).days)
        hours_needed = e.weight * 6.0  # importance 1..5 -> 6..30h
        studied_min = 0.0
        if e.subject_id:
            start = today - timedelta(days=30)
            from ..models import StudySession
            rows = (
                db.query(StudySession)
                .filter(
                    StudySession.subject_id == e.subject_id,
                    StudySession.status == "finished",
                    StudySession.started_at >= datetime.combine(start, datetime.min.time()),
                )
                .all()
            )
            studied_min = sum(s.duration_seconds for s in rows) / 60.0
        hours_studied = studied_min / 60.0
        readiness = min(100.0, round(100.0 * hours_studied / hours_needed))
        pace_hours = hours_needed / (days_left / 7.0)
        out.append({
            "exam_id": e.id,
            "title": e.title,
            "subject": e.subject.name if e.subject else None,
            "days_left": days_left,
            "hours_needed": round(hours_needed, 1),
            "hours_studied": round(hours_studied, 1),
            "pace_hours_per_week": round(pace_hours, 1),
            "readiness": readiness,
        })
    return out


@router.get("/overview")
def overview(db: Session = Depends(get_db)):
    settings_map = {s.key: s.value for s in db.query(Setting).all()}
    weekly_goal = float(settings_map.get("weekly_goal_hours", 14.0))
    return {
        "daily": analytics.daily_study(db, 30),
        "weekly": analytics.weekly_totals(db, 12),
        "monthly": analytics.monthly_totals(db, 6),
        "subject_distribution": analytics.subject_distribution(db),
        "heatmap": analytics.study_heatmap(db, 26),
        "streak": analytics.study_streak(db),
        "productivity_score": analytics.productivity_score(db, weekly_goal),
        "learning_curve": analytics.learning_curve(db, 8),
        "productivity_trend": analytics.productivity_trend(db, 8, weekly_goal),
        "burnout_trend": analytics.burnout_trend(db, 30),
        "burnout_index": analytics.burnout_index(db),
        "weak_topics": analytics.weak_topics(db, 5),
        "exam_readiness": _exam_readiness(db),
        "total_minutes": sum(analytics.daily_study(db, 30)["minutes"]),
    }


@router.get("/heatmap")
def heatmap(db: Session = Depends(get_db)):
    return {"cells": analytics.study_heatmap(db, 26)}


@router.get("/learning-dna")
def dna(db: Session = Depends(get_db)):
    return analytics.learning_dna(db)
