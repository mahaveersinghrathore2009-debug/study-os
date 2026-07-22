from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Subject, Topic
from ..schemas import SubjectCreate, SubjectOut, SubjectUpdate, TopicCreate, TopicOut

router = APIRouter(prefix="/api/subjects", tags=["subjects"])


def _build_tree(subject: Subject) -> SubjectOut:
    topics = {t.id: t for t in subject.topics}
    by_parent: dict[int | None, list[Topic]] = {}
    for t in topics.values():
        by_parent.setdefault(t.parent_id, []).append(t)

    def build(topic: Topic) -> TopicOut:
        return TopicOut(
            id=topic.id,
            subject_id=topic.subject_id,
            parent_id=topic.parent_id,
            name=topic.name,
            notes=topic.notes,
            mastery=topic.mastery,
            difficulty=topic.difficulty,
            children=[build(c) for c in sorted(by_parent.get(topic.id, []), key=lambda t: t.name)],
        )

    return SubjectOut(
        id=subject.id,
        name=subject.name,
        color=subject.color,
        icon=subject.icon,
        weekly_goal_hours=subject.weekly_goal_hours,
        target_exam_date=subject.target_exam_date,
        created_at=subject.created_at,
        topics=[build(t) for t in sorted(by_parent.get(None, []), key=lambda t: t.name)],
    )


@router.get("", response_model=list[SubjectOut])
def list_subjects(db: Session = Depends(get_db)):
    return [_build_tree(s) for s in db.query(Subject).order_by(Subject.name).all()]


@router.post("", response_model=SubjectOut)
def create_subject(payload: SubjectCreate, db: Session = Depends(get_db)):
    subj = Subject(**payload.model_dump())
    db.add(subj)
    db.commit()
    db.refresh(subj)
    return _build_tree(subj)


@router.patch("/{subject_id}", response_model=SubjectOut)
def update_subject(subject_id: int, payload: SubjectUpdate, db: Session = Depends(get_db)):
    subj = db.get(Subject, subject_id)
    if not subj:
        raise HTTPException(404, "Subject not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(subj, k, v)
    db.commit()
    db.refresh(subj)
    return _build_tree(subj)


@router.delete("/{subject_id}")
def delete_subject(subject_id: int, db: Session = Depends(get_db)):
    subj = db.get(Subject, subject_id)
    if not subj:
        raise HTTPException(404, "Subject not found")
    db.delete(subj)
    db.commit()
    return {"ok": True}


@router.post("/topics", response_model=TopicOut)
def create_topic(payload: TopicCreate, db: Session = Depends(get_db)):
    if not db.get(Subject, payload.subject_id):
        raise HTTPException(404, "Subject not found")
    if payload.parent_id and not db.get(Topic, payload.parent_id):
        raise HTTPException(404, "Parent topic not found")
    topic = Topic(**payload.model_dump())
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return TopicOut(
        id=topic.id, subject_id=topic.subject_id, parent_id=topic.parent_id,
        name=topic.name, notes=topic.notes, mastery=topic.mastery,
        difficulty=topic.difficulty, children=[],
    )


@router.patch("/topics/{topic_id}", response_model=TopicOut)
def update_topic(topic_id: int, payload: TopicCreate, db: Session = Depends(get_db)):
    topic = db.get(Topic, topic_id)
    if not topic:
        raise HTTPException(404, "Topic not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(topic, k, v)
    db.commit()
    db.refresh(topic)
    return TopicOut(
        id=topic.id, subject_id=topic.subject_id, parent_id=topic.parent_id,
        name=topic.name, notes=topic.notes, mastery=topic.mastery,
        difficulty=topic.difficulty, children=[],
    )


@router.delete("/topics/{topic_id}")
def delete_topic(topic_id: int, db: Session = Depends(get_db)):
    topic = db.get(Topic, topic_id)
    if not topic:
        raise HTTPException(404, "Topic not found")
    db.delete(topic)
    db.commit()
    return {"ok": True}
