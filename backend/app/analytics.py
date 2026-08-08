"""Deterministic analytics + the Learning DNA engine (works fully offline)."""
from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from .models import utcnow, MoodEntry, StudySession, Subject, Topic

MIN_SESSION_SECONDS = 60  # sessions shorter than this don't count toward streaks/hours
DAY = timedelta(days=1)


# --------------------------------------------------------------------------
# helpers
# --------------------------------------------------------------------------
def _finished(db: Session):
    return (
        db.query(StudySession)
        .filter(StudySession.status == "finished", StudySession.duration_seconds >= MIN_SESSION_SECONDS)
    )


def minutes_of(sessions: list[StudySession]) -> int:
    return int(sum(s.duration_seconds for s in sessions) / 60)


def sessions_by_day(db: Session, days: int, end: Optional[date] = None) -> dict[date, int]:
    end = end or date.today()
    start = end - timedelta(days=days - 1)
    rows = (
        _finished(db)
        .filter(func.date(StudySession.started_at) >= start.isoformat())
        .with_entities(func.date(StudySession.started_at).label("d"), func.sum(StudySession.duration_seconds))
        .group_by("d")
        .all()
    )
    out: dict[date, int] = {}
    for day, secs in rows:
        out[date.fromisoformat(day)] = int(secs / 60)
    return out


def _day_range(period: str, now: Optional[date] = None) -> tuple[date, date]:
    """Return (start, end) of the period that `now` falls into."""
    now = now or date.today()
    if period == "daily":
        return now, now
    if period == "weekly":
        start = now - timedelta(days=now.weekday())
        return start, start + timedelta(days=6)
    if period == "monthly":
        start = now.replace(day=1)
        return start, now
    if period == "yearly":
        return now.replace(month=1, day=1), now
    raise ValueError(period)


def progress_for(db: Session, period: str, unit: str, subject_id: Optional[int]) -> tuple[float, float]:
    """(completed, target) for a goal in the given period."""
    start, end = _day_range(period)
    q = _finished(db).filter(func.date(StudySession.started_at) >= start.isoformat(), func.date(StudySession.started_at) <= end.isoformat())
    if subject_id:
        q = q.filter(StudySession.subject_id == subject_id)
    sessions = q.all()
    if unit == "sessions":
        completed = float(len(sessions))
    else:
        completed = sum(s.duration_seconds for s in sessions) / 3600.0
    return completed, 0.0  # target filled in by caller


# --------------------------------------------------------------------------
# streak
# --------------------------------------------------------------------------
def study_streak(db: Session, now: Optional[date] = None) -> int:
    """Consecutive days (ending today or yesterday) with >= MIN_SESSION_SECONDS studied."""
    now = now or date.today()
    by_day = sessions_by_day(db, 400, end=now)
    if not by_day:
        return 0
    # Allow the streak to be "alive" if today has no study yet but yesterday did.
    cursor = now if by_day.get(now, 0) > 0 else now - DAY
    streak = 0
    while by_day.get(cursor, 0) > 0:
        streak += 1
        cursor -= DAY
    return streak


# --------------------------------------------------------------------------
# productivity score (0..100)
# --------------------------------------------------------------------------
def productivity_score(db: Session, weekly_goal_hours: float = 14.0, now: Optional[date] = None) -> int:
    now = now or date.today()
    start, end = _day_range("weekly", now)
    week_sessions = (
        _finished(db)
        .filter(func.date(StudySession.started_at) >= start.isoformat(), func.date(StudySession.started_at) <= end.isoformat())
        .all()
    )
    week_hours = sum(s.duration_seconds for s in week_sessions) / 3600.0

    goal_part = min(40.0, 40.0 * (week_hours / max(weekly_goal_hours, 0.5)))
    days_studied = len({s.started_at.date() for s in week_sessions})
    consistency = 25.0 * (days_studied / 7.0)
    focus = 0.0
    if week_sessions:
        avg_min = sum(s.duration_seconds for s in week_sessions) / len(week_sessions) / 60.0
        focus = 20.0 * min(1.0, avg_min / 45.0)
    streak = min(study_streak(db, now), 14)
    bonus = 15.0 * (streak / 14.0)
    return int(round(min(100.0, goal_part + consistency + focus + bonus)))


# --------------------------------------------------------------------------
# chart datasets
# --------------------------------------------------------------------------
def daily_study(db: Session, days: int = 30, now: Optional[date] = None) -> dict:
    now = now or date.today()
    by_day = sessions_by_day(db, days, end=now)
    start = now - timedelta(days=days - 1)
    dates, minutes = [], []
    for i in range(days):
        d = start + timedelta(days=i)
        dates.append(d.isoformat())
        minutes.append(by_day.get(d, 0))
    return {"dates": dates, "minutes": minutes}


def weekly_totals(db: Session, weeks: int = 12, now: Optional[date] = None) -> dict:
    now = now or date.today()
    week_ends: list[date] = []
    totals: list[int] = []
    # anchor on the Monday of the current week
    anchor_monday = now - timedelta(days=now.weekday())
    for i in range(weeks - 1, -1, -1):
        monday = anchor_monday - timedelta(weeks=i)
        sunday = monday + timedelta(days=6)
        week_ends.append(sunday.isoformat())
        mins = minutes_of(
                _finished(db)
                .filter(func.date(StudySession.started_at) >= monday.isoformat(), func.date(StudySession.started_at) <= sunday.isoformat())
                .all()
        )
        totals.append(mins)
    return {"labels": week_ends, "minutes": totals}


def monthly_totals(db: Session, months: int = 6, now: Optional[date] = None) -> dict:
    now = now or date.today()
    labels, totals = [], []
    cur = now.replace(day=1)
    for _ in range(months):
        month_start = cur
        next_month = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
        labels.append(month_start.strftime("%b %Y"))
        totals.append(
            minutes_of(
                _finished(db)
                .filter(
                    func.date(StudySession.started_at) >= month_start.isoformat(),
                    func.date(StudySession.started_at) < next_month.isoformat(),
                )
                .all()
            )
        )
        cur = (month_start - timedelta(days=1)).replace(day=1)
    labels.reverse()
    totals.reverse()
    return {"labels": labels, "minutes": totals}


def subject_distribution(db: Session, now: Optional[date] = None) -> list[dict]:
    rows = (
        db.query(Subject.name, Subject.color, func.sum(StudySession.duration_seconds))
        .join(StudySession, StudySession.subject_id == Subject.id)
        .filter(StudySession.status == "finished")
        .group_by(Subject.id)
        .all()
    )
    return [
        {"name": name, "color": color, "minutes": int(secs / 60)}
        for name, color, secs in rows
        if secs
    ]


def study_heatmap(db: Session, weeks: int = 26, now: Optional[date] = None) -> list[dict]:
    """GitHub-style contribution grid. Returns cells {date, minutes, level}."""
    now = now or date.today()
    by_day = sessions_by_day(db, weeks * 7, end=now)
    start = now - timedelta(days=weeks * 7 - 1)
    cells = []
    for i in range(weeks * 7):
        d = start + timedelta(days=i)
        mins = by_day.get(d, 0)
        level = 0
        if mins > 0:
            level = min(4, 1 + mins // 30)
        cells.append({"date": d.isoformat(), "minutes": mins, "level": level})
    return cells


def learning_curve(db: Session, weeks: int = 8, now: Optional[date] = None) -> dict:
    """Efficiency over time: weekly average session length (focus depth) + sessions/day."""
    now = now or date.today()
    anchor_monday = now - timedelta(days=now.weekday())
    labels, avg_length, sessions_per_day = [], [], []
    for i in range(weeks - 1, -1, -1):
        monday = anchor_monday - timedelta(weeks=i)
        sunday = monday + timedelta(days=6)
        sess = (
            _finished(db)
            .filter(func.date(StudySession.started_at) >= monday.isoformat(), func.date(StudySession.started_at) <= sunday.isoformat())
            .all()
        )
        labels.append(monday.strftime("%m/%d"))
        avg_length.append(round(sum(s.duration_seconds for s in sess) / len(sess) / 60, 1) if sess else 0)
        days_studied = len({s.started_at.date() for s in sess})
        sessions_per_day.append(round(days_studied / 7.0, 2))
    return {"labels": labels, "avg_length_min": avg_length, "sessions_per_day": sessions_per_day}


def productivity_trend(db: Session, weeks: int = 8, weekly_goal_hours: float = 14.0) -> dict:
    now = date.today()
    anchor_monday = now - timedelta(days=now.weekday())
    labels, scores = [], []
    for i in range(weeks - 1, -1, -1):
        week_now = anchor_monday - timedelta(weeks=i)
        labels.append(week_now.strftime("%m/%d"))
        scores.append(productivity_score(db, weekly_goal_hours, now=week_now + timedelta(days=6)))
    return {"labels": labels, "scores": scores}


def burnout_trend(db: Session, days: int = 30) -> list[dict]:
    by_day = sessions_by_day(db, days)
    moods = {m.entry_date: m.mood for m in db.query(MoodEntry).all()}
    out = []
    for i in range(days):
        d = date.today() - timedelta(days=days - 1 - i)
        mins = by_day.get(d, 0)
        risk = 0
        if mins > 0:
            risk += min(40, mins // 12)
        m = moods.get(d)
        if m is not None:
            risk += (5 - m) * 12
        out.append({"date": d.isoformat(), "risk": min(100, risk)})
    return out


def burnout_index(db: Session) -> dict:
    now = date.today()
    start = now - timedelta(days=6)
    sess = _finished(db).filter(func.date(StudySession.started_at) >= start.isoformat()).all()
    total_hours = sum(s.duration_seconds for s in sess) / 3600.0
    moods = db.query(MoodEntry).filter(MoodEntry.entry_date >= start).all()
    avg_mood = sum(m.mood for m in moods) / len(moods) if moods else None
    risk, reasons = 0, []
    if total_hours > 35:
        risk += 40
        reasons.append("very heavy study load this week")
    elif total_hours > 25:
        risk += 25
        reasons.append("heavy study load this week")
    if avg_mood is not None and avg_mood <= 2:
        risk += 30
        reasons.append("consistently low mood")
    if avg_mood is not None and avg_mood <= 3 and len(moods) >= 5:
        risk += 15
        reasons.append("slightly low mood trend")
    long = [s for s in sess if s.duration_seconds > 2 * 3600]
    if len(long) >= 3:
        risk += 20
        reasons.append("many very long sessions (2h+); consider breaks")
    days_studied = len({s.started_at.date() for s in sess})
    if days_studied >= 7 and total_hours < 8:
        risk = min(risk, 15)
    risk = min(100, risk)
    level = "low" if risk < 33 else ("medium" if risk < 66 else "high")
    tip = {
        "low": "You look great — keep your rhythm and protect your sleep.",
        "medium": "Your workload is climbing. Add a real break between sessions and try a lighter day soon.",
        "high": "Burnout risk is high. Take a full rest day, shorten sessions, and protect your sleep.",
    }[level]
    return {"risk": risk, "level": level, "reasons": reasons, "tip": tip, "total_hours": round(total_hours, 1)}


def weak_topics(db: Session, limit: int = 5) -> list[dict]:
    today = date.today()
    rows = db.query(Topic, Subject.name).join(Subject, Topic.subject_id == Subject.id).all()
    candidates = []
    for topic, subject_name in rows:
        sessions = (
            db.query(StudySession)
            .filter(StudySession.topic_id == topic.id, StudySession.status == "finished")
            .order_by(StudySession.started_at.desc())
            .all()
        )
        minutes = sum(s.duration_seconds for s in sessions) / 60
        moods = [s.mood for s in sessions if s.mood]
        avg_mood = sum(moods) / len(moods) if moods else None
        score, reasons = 0.0, []
        if topic.mastery < 0.4:
            score += 0.5
            reasons.append("low mastery")
        if minutes < 60:
            score += 0.3
            reasons.append("studied very little")
        if topic.difficulty >= 4:
            score += 0.3
            reasons.append("high difficulty")
        if avg_mood is not None and avg_mood <= 2.5 and len(moods) >= 2:
            score += 0.4
            reasons.append("struggled during sessions")
        if sessions and (today - sessions[-1].started_at.date()).days > 14:
            score += 0.3
            reasons.append("not revised recently")
        if score > 0:
            candidates.append({
                "topic_id": topic.id,
                "topic": topic.name,
                "subject": subject_name,
                "mastery": topic.mastery,
                "minutes": int(minutes),
                "difficulty": topic.difficulty,
                "score": round(min(score, 1.0), 2),
                "reasons": reasons,
            })
    candidates.sort(key=lambda c: c["score"], reverse=True)
    return candidates[:limit]


def learning_dna(db: Session) -> dict:
    """The flagship feature: build a personal learning profile from real data."""
    now = date.today()
    start = now - timedelta(days=90)
    sess = _finished(db).filter(func.date(StudySession.started_at) >= start.isoformat()).all()
    dna: dict = {"window_days": 90, "generated_at": utcnow().isoformat()}
    if not sess:
        dna["empty"] = True
        return dna

    hour_minutes: dict[int, int] = defaultdict(int)
    hour_mood: dict[int, list[int]] = defaultdict(list)
    for s in sess:
        hour_minutes[s.started_at.hour] += s.duration_seconds
        if s.mood:
            hour_mood[s.started_at.hour].append(s.mood)
    ranked_hours = sorted(hour_minutes.items(), key=lambda kv: -kv[1])[:3]
    dna["best_hours"] = [
        {"hour": h, "minutes": int(m / 60), "avg_mood": round(sum(hour_mood.get(h, [3])) / max(1, len(hour_mood.get(h, []))), 1)}
        for h, m in ranked_hours
    ]

    if len(sess) >= 3:
        short = [s for s in sess if s.duration_seconds <= 30 * 60]
        ideal = [s for s in sess if 30 * 60 < s.duration_seconds <= 75 * 60]
        long = [s for s in sess if s.duration_seconds > 75 * 60]
        groups = {"short_30min": short, "ideal_45min": ideal, "long_75plus": long}
        dna["session_lengths"] = {
            k: {"count": len(v), "avg_mood": _avg_mood(v)} for k, v in groups.items()
        }
        best_key = max(groups, key=lambda k: len(groups[k]))
        dna["ideal_length_min"] = {"short_30min": 25, "ideal_45min": 45, "long_75plus": 90}[best_key]

    subj_rows = (
        db.query(Subject.id, Subject.name, func.sum(StudySession.duration_seconds))
        .join(StudySession, StudySession.subject_id == Subject.id)
        .filter(StudySession.status == "finished")
        .group_by(Subject.id)
        .all()
    )
    per_subject = []
    for sid, name, secs in subj_rows:
        topics = db.query(Topic).filter(Topic.subject_id == sid).all()
        avg_mastery = sum(t.mastery for t in topics) / len(topics) if topics else 0.0
        per_subject.append({"subject": name, "minutes": int(secs / 60), "avg_mastery": round(avg_mastery, 2)})
    if per_subject:
        per_subject.sort(key=lambda r: r["avg_mastery"] + min(1, r["minutes"] / 600) * 0.5, reverse=True)
        dna["strongest_subjects"] = per_subject[:2]
        dna["struggling_subjects"] = per_subject[-2:]

    dna["struggling_topics"] = weak_topics(db, limit=3)

    from .models import Flashcard as _Fc  # noqa: F401  (avoid import cycle at module top)
    flash_reviews = db.query(_Fc).filter(_Fc.reviews > 0).count()
    practice_ratio = min(1.0, (flash_reviews / 20.0) + (len(sess) / 120.0))
    dna["learning_style"] = {
        "practice_lean": round(practice_ratio, 2),
        "reading_lean": round(1 - practice_ratio, 2),
        "hint": "You benefit from active recall (flashcards + quizzes) — keep them in your routine."
        if practice_ratio > 0.5
        else "You learn well by focused reading — add 5-min recall quizzes to lock concepts in.",
    }

    trend = burnout_trend(db, 14)
    recent = [t["risk"] for t in trend[-7:]]
    earlier = [t["risk"] for t in trend[:7]]
    dna["burnout_pattern"] = {
        "recent_avg_risk": round(sum(recent) / max(1, len(recent)), 1),
        "earlier_avg_risk": round(sum(earlier) / max(1, len(earlier)), 1),
        "trending_up": sum(recent) / max(1, len(recent)) > sum(earlier) / max(1, len(earlier)) + 5,
    }

    revised = [t for t in db.query(Topic).all() if t.mastery > 0]
    dna["revision_effectiveness"] = round(sum(t.mastery for t in revised) / len(revised), 2) if revised else None
    dna["summary"] = _dna_summary(dna)
    dna["empty"] = False
    return dna


def _avg_mood(group) -> Optional[float]:
    moods = [s.mood for s in group if s.mood]
    return round(sum(moods) / len(moods), 1) if moods else None


def _dna_summary(dna: dict) -> str:
    if dna.get("empty"):
        return ("Study for a few days and I'll learn how you learn — your best hours, "
                "ideal session length and the topics that need attention.")
    bits = []
    bh = dna.get("best_hours", [])
    if bh:
        bits.append(f"You're most productive around {bh[0]['hour']:02d}:00 — your peak focus window")
    il = dna.get("ideal_length_min")
    if il:
        bits.append(f"your ideal session length is about {il} minutes")
    ss = dna.get("strongest_subjects")
    if ss:
        bits.append(f"you retain {ss[0]['subject']} best (mastery {ss[0]['avg_mastery']:.0%})")
    st = dna.get("struggling_topics")
    if st:
        bits.append(f"{st[0]['subject']}: {st[0]['topic']} needs the most work")
    ls = dna.get("learning_style", {})
    if ls.get("hint"):
        bits.append(ls["hint"].lower())
    bp = dna.get("burnout_pattern", {})
    if bp.get("trending_up"):
        bits.append("your burnout risk is rising — schedule a lighter day soon")
    return " ".join(bits) + "."
