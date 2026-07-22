from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import analytics
from ..database import get_db
from ..models import Goal
from ..schemas import GoalCreate, GoalOut

router = APIRouter(prefix="/api/goals", tags=["goals"])


def _with_progress(g: Goal, db: Session) -> GoalOut:
    completed, _ = analytics.progress_for(db, g.period, g.unit, g.subject_id)
    return GoalOut(
        id=g.id,
        title=g.title,
        period=g.period,
        unit=g.unit,
        target=g.target,
        subject_id=g.subject_id,
        progress=round(min(1.0, completed / g.target), 3),
        remaining=round(max(0.0, g.target - completed), 2),
    )


@router.get("", response_model=list[GoalOut])
def list_goals(db: Session = Depends(get_db)):
    return [_with_progress(g, db) for g in db.query(Goal).order_by(Goal.created_at).all()]


@router.post("", response_model=GoalOut)
def create_goal(payload: GoalCreate, db: Session = Depends(get_db)):
    goal = Goal(**payload.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return _with_progress(goal, db)


@router.delete("/{goal_id}")
def delete_goal(goal_id: int, db: Session = Depends(get_db)):
    g = db.get(Goal, goal_id)
    if not g:
        raise HTTPException(404, "Goal not found")
    db.delete(g)
    db.commit()
    return {"ok": True}
