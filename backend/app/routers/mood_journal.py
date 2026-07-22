from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import JournalEntry, MoodEntry
from ..schemas import JournalCreate, JournalOut, MoodCreate, MoodOut

router = APIRouter(prefix="/api", tags=["mood-journal"])


# --------------------------- mood ---------------------------
@router.get("/mood", response_model=list[MoodOut])
def mood_trend(days: int = Query(14, ge=1, le=90), db: Session = Depends(get_db)):
    start = date.today() - timedelta(days=days - 1)
    entries = db.query(MoodEntry).filter(MoodEntry.entry_date >= start).order_by(MoodEntry.entry_date).all()
    by_date = {e.entry_date: e for e in entries}
    out = []
    for i in range(days):
        d = start + timedelta(days=i)
        e = by_date.get(d)
        if e:
            out.append(MoodOut(id=e.id, entry_date=e.entry_date, mood=e.mood, energy=e.energy, note=e.note))
    return out


@router.post("/mood", response_model=MoodOut)
def log_mood(payload: MoodCreate, db: Session = Depends(get_db)):
    existing = db.query(MoodEntry).filter(MoodEntry.entry_date == payload.entry_date).first()
    if existing:
        existing.mood = payload.mood
        existing.energy = payload.energy
        existing.note = payload.note
        db.commit()
        db.refresh(existing)
        return MoodOut(id=existing.id, entry_date=existing.entry_date, mood=existing.mood, energy=existing.energy, note=existing.note)
    entry = MoodEntry(**payload.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return MoodOut(id=entry.id, entry_date=entry.entry_date, mood=entry.mood, energy=entry.energy, note=entry.note)


# --------------------------- journal ---------------------------
@router.get("/journal", response_model=JournalOut)
def get_journal(entry_date: date = Query(...), db: Session = Depends(get_db)):
    entry = db.query(JournalEntry).filter(JournalEntry.entry_date == entry_date).first()
    if not entry:
        raise HTTPException(404, "No journal entry for this date")
    return entry


@router.get("/journal/list", response_model=list[JournalOut])
def list_journal(limit: int = Query(50, le=200), db: Session = Depends(get_db)):
    return db.query(JournalEntry).order_by(JournalEntry.entry_date.desc()).limit(limit).all()


@router.put("/journal", response_model=JournalOut)
def upsert_journal(payload: JournalCreate, db: Session = Depends(get_db)):
    entry = db.query(JournalEntry).filter(JournalEntry.entry_date == payload.entry_date).first()
    if entry:
        entry.content = payload.content
    else:
        entry = JournalEntry(entry_date=payload.entry_date, content=payload.content)
        db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
