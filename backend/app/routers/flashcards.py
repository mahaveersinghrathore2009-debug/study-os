from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Flashcard
from ..schemas import FlashcardCreate, FlashcardOut, FlashcardReview

router = APIRouter(prefix="/api/flashcards", tags=["flashcards"])


def _out(c: Flashcard) -> FlashcardOut:
    return FlashcardOut(
        id=c.id, subject_id=c.subject_id, topic_id=c.topic_id,
        front=c.front, back=c.back, ease=c.ease,
        interval_days=c.interval_days, reviews=c.reviews, due_date=c.due_date,
    )


def _sm2(c: Flashcard, rating: str) -> None:
    """A practical spaced-repetition update (SM-2 inspired)."""
    if rating == "again":
        c.ease = max(1.3, c.ease - 0.2)
        c.interval_days = 0
        c.due_date = date.today()
    elif rating == "easy":
        c.ease += 0.15
        if c.reviews == 0:
            c.interval_days = 3
        else:
            c.interval_days = max(1, round(c.interval_days * c.ease * 1.3))
        c.due_date = date.today() + timedelta(days=c.interval_days)
    else:  # good
        if c.reviews == 0:
            c.interval_days = 1
        else:
            c.interval_days = max(1, round(c.interval_days * c.ease))
        c.due_date = date.today() + timedelta(days=c.interval_days)
    c.reviews += 1


@router.get("", response_model=list[FlashcardOut])
def list_flashcards(
    due: bool = False,
    subject_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Flashcard)
    if subject_id:
        q = q.filter(Flashcard.subject_id == subject_id)
    if due:
        q = q.filter(Flashcard.due_date <= date.today())
    return [_out(c) for c in q.order_by(Flashcard.due_date).all()]


@router.post("", response_model=FlashcardOut)
def create_flashcard(payload: FlashcardCreate, db: Session = Depends(get_db)):
    card = Flashcard(**payload.model_dump())
    db.add(card)
    db.commit()
    db.refresh(card)
    return _out(card)


@router.post("/{card_id}/review", response_model=FlashcardOut)
def review_flashcard(card_id: int, payload: FlashcardReview, db: Session = Depends(get_db)):
    card = db.get(Flashcard, card_id)
    if not card:
        raise HTTPException(404, "Flashcard not found")
    _sm2(card, payload.rating)
    db.commit()
    db.refresh(card)
    return _out(card)


@router.delete("/{card_id}")
def delete_flashcard(card_id: int, db: Session = Depends(get_db)):
    card = db.get(Flashcard, card_id)
    if not card:
        raise HTTPException(404, "Flashcard not found")
    db.delete(card)
    db.commit()
    return {"ok": True}
