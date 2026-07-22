from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Note
from ..schemas import NoteCreate, NoteOut

router = APIRouter(prefix="/api/notes", tags=["notes"])


@router.get("", response_model=list[NoteOut])
def list_notes(search: Optional[str] = None, limit: int = Query(200, le=1000), db: Session = Depends(get_db)):
    q = db.query(Note).order_by(Note.pinned.desc(), Note.updated_at.desc())
    if search:
        like = f"%{search}%"
        q = q.filter(or_(Note.title.ilike(like), Note.content_md.ilike(like)))
    return q.limit(limit).all()


@router.get("/{note_id}", response_model=NoteOut)
def get_note(note_id: int, db: Session = Depends(get_db)):
    note = db.get(Note, note_id)
    if not note:
        raise HTTPException(404, "Note not found")
    return note


@router.post("", response_model=NoteOut)
def create_note(payload: NoteCreate, db: Session = Depends(get_db)):
    note = Note(**payload.model_dump())
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.patch("/{note_id}", response_model=NoteOut)
def update_note(note_id: int, payload: NoteCreate, db: Session = Depends(get_db)):
    note = db.get(Note, note_id)
    if not note:
        raise HTTPException(404, "Note not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(note, k, v)
    db.commit()
    db.refresh(note)
    return note


@router.delete("/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db)):
    note = db.get(Note, note_id)
    if not note:
        raise HTTPException(404, "Note not found")
    db.delete(note)
    db.commit()
    return {"ok": True}
