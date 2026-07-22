from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import ai_service
from ..database import get_db
from ..models import AIHistory
from ..schemas import ChatRequest, PlanRequest, QuizRequest, SummarizeRequest

router = APIRouter(prefix="/api/ai", tags=["ai"])


def _record(db: Session, kind: str, prompt: str, response: str) -> None:
    db.add(AIHistory(kind=kind, prompt=prompt[:2000], response=response[:4000], model="offline"))
    db.commit()


@router.get("/status")
def status():
    return ai_service.ai_status()


@router.post("/chat")
def chat(payload: ChatRequest, db: Session = Depends(get_db)):
    text, used_ai = ai_service.chat(db, payload.message, payload.history)
    _record(db, "chat", payload.message, text)
    return {"response": text, "used_ai": used_ai}


@router.post("/summarize")
def summarize(payload: SummarizeRequest, db: Session = Depends(get_db)):
    text, used_ai = ai_service.summarize(db, payload.text)
    _record(db, "summarize", payload.text[:500], text)
    return {"response": text, "used_ai": used_ai}


@router.post("/quiz")
def quiz(payload: QuizRequest, db: Session = Depends(get_db)):
    text, used_ai = ai_service.quiz(db, payload.topic, payload.count, payload.kind)
    _record(db, "quiz", f"{payload.kind} on {payload.topic}", text)
    return {"response": text, "used_ai": used_ai}


@router.post("/plan")
def plan(payload: PlanRequest, db: Session = Depends(get_db)):
    hint = f"for {payload.date or 'today'}" + (f" with {payload.available_hours}h available" if payload.available_hours else "")
    text, used_ai = ai_service.plan(db, hint)
    _record(db, "plan", hint, text)
    return {"response": text, "used_ai": used_ai}


@router.post("/motivate")
def motivate(db: Session = Depends(get_db)):
    text, used_ai = ai_service.motivate(db)
    _record(db, "motivate", "motivate me", text)
    return {"response": text, "used_ai": used_ai}


@router.get("/learning-dna")
def learning_dna(db: Session = Depends(get_db)):
    return ai_service.learning_dna_report(db)


@router.get("/weak-topics")
def weak_topics(db: Session = Depends(get_db)):
    return {"topics": ai_service.weak_topics_report(db)}


@router.get("/burnout")
def burnout(db: Session = Depends(get_db)):
    return ai_service.burnout_report(db)


@router.get("/history")
def history(limit: int = 20, db: Session = Depends(get_db)):
    rows = db.query(AIHistory).order_by(AIHistory.created_at.desc()).limit(limit).all()
    return [
        {"id": h.id, "kind": h.kind, "prompt": h.prompt, "response": h.response, "created_at": h.created_at}
        for h in rows
    ]
