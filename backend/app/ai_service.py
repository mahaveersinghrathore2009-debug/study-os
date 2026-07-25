"""Ollama integration with graceful degradation when no local model is running.

Every AI feature has a deterministic fallback so StudyOS is fully usable offline
even before Ollama is installed.
"""
from __future__ import annotations

import json
from typing import Optional

import httpx
from sqlalchemy.orm import Session

from . import analytics
from .config import settings

OFFLINE_NOTICE = (
    "\n\n_(Ollama isn't running — showing the offline StudyOS engine instead. "
    "Install Ollama and pull a model to unlock full local AI.)_"
)


# --------------------------------------------------------------------------
# transport
# --------------------------------------------------------------------------
def ollama_available(url: Optional[str] = None) -> bool:
    url = url or settings.ollama_url
    try:
        r = httpx.get(f"{url}/api/tags", timeout=2.0)
        return r.status_code == 200
    except Exception:
        return False


def _chat(messages: list[dict], url: str, model: str) -> Optional[str]:
    try:
        r = httpx.post(
            f"{url}/api/chat",
            json={"model": model, "messages": messages, "stream": False},
            timeout=120.0,
        )
        r.raise_for_status()
        return r.json().get("message", {}).get("content", "")
    except Exception:
        return None


def _generate(prompt: str, url: str, model: str) -> Optional[str]:
    return _chat([{"role": "user", "content": prompt}], url, model)


def _system(content: str) -> dict:
    return {"role": "system", "content": content}


def _try_ai(prompt: str, system: str, db: Session, kind: str) -> tuple[str, bool]:
    """Run prompt through Ollama; on failure return (fallback_message, used_ai)."""
    used = False
    if ollama_available():
        resp = _generate(prompt, settings.ollama_url, settings.ollama_model)
        if resp:
            used = True
            return resp.strip(), used
    fallback = _offline_engine(db, kind, prompt)
    return fallback + OFFLINE_NOTICE, used


# --------------------------------------------------------------------------
# offline engine (deterministic, private, always works)
# --------------------------------------------------------------------------
def _offline_engine(db: Session, kind: str, prompt: str) -> str:
    if kind == "chat":
        return _offline_chat(db, prompt)
    if kind == "summarize":
        return _offline_summarize(prompt)
    if kind == "quiz":
        return _offline_quiz(prompt)
    if kind == "plan":
        return _offline_plan(db, prompt)
    if kind == "motivate":
        return _offline_motivate(db)
    if kind == "dna":
        return _offline_dna(db)
    if kind == "weak":
        return _offline_weak(db)
    if kind == "burnout":
        return _offline_burnout(db)
    return "I'm here to help you study. Ask me anything."


def _offline_chat(db: Session, message: str) -> str:
    dna = analytics.learning_dna(db)
    low = message.lower()
    if any(w in low for w in ["plan", "schedule", "organize"]):
        return _offline_plan(db, message)
    if any(w in low for w in ["motivat", "tired", "give up", "stuck"]):
        return _offline_motivate(db)
    if any(w in low for w in ["weak", "struggle"]):
        return _offline_weak(db)
    if any(w in low for w in ["dna", "learn", "profile", "how do i study"]):
        return _offline_dna(db)
    if not dna.get("empty"):
        return (
            f"Here's what your study data tells me: {dna['summary']} "
            "Want a plan for today, a quiz, or a summary of your notes?"
        )
    return (
        "Welcome! Once you log a few study sessions I'll give you personalised advice. "
        "Try asking me to plan your day, explain a concept, or quiz you on a topic."
    )


def _offline_summarize(text: str) -> str:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    if not lines:
        return "Nothing to summarize yet — write some notes first."
    n = max(3, len(lines) // 3)
    body = lines[:n]
    head = "Summary:\n\n" + "\n".join(f"- {ln[:160]}" for ln in body)
    head += f"\n\n_(compressed {len(lines)} lines to {n} bullet points offline)_"
    return head


def _offline_quiz(prompt: str) -> str:
    import re

    m = re.search(r"topic '([^']+)'", prompt) or re.search(r"(?:quiz|on)\s+['\"]?([A-Za-z0-9 _\-]+)", prompt, re.I)
    topic = m.group(1).strip() if m else "this topic"
    return (
        f"Offline quiz on **{topic}** (3 questions):\n\n"
        f"1. What is the single most important definition in {topic}?\n"
        f"2. Give a real-world example that uses {topic}.\n"
        f"3. What is the most common mistake students make with {topic}?\n\n"
        "Answer these aloud or in your notes — self-explanation is proven to boost retention."
    )


def _offline_plan(db: Session, prompt: str) -> str:
    wt = analytics.weak_topics(db, limit=3)
    dna = analytics.learning_dna(db)
    lines = ["Today's study plan (generated offline):"]
    if wt:
        lines.append(f"- Start with your weakest topic: **{wt[0]['topic']}** ({wt[0]['subject']}) — 25 min")
    if not dna.get("empty"):
        il = dna.get("ideal_length_min")
        lines.append(f"- Use ~{il}-minute focus blocks (your best length)")
    lines.append("- Mix one recall session: flashcards or a quiz")
    lines.append("- End with a 5-minute review of what you learned")
    lines.append("- Log mood after each session so the AI learns your patterns")
    return "\n".join(lines)


def _offline_motivate(db: Session) -> str:
    streak = analytics.study_streak(db)
    score = analytics.productivity_score(db)
    if streak >= 7:
        return f"A {streak}-day streak! That's real consistency. Momentum is on your side — keep showing up and protect it."
    if streak >= 3:
        return f"{streak} days in a row — you're building the habit. Today's session counts double for the streak, go get it."
    if score >= 60:
        return "You're studying smart and consistently. One more focused session today and you'll feel great about it."
    return "Every expert was once a beginner who refused to quit. Start with 25 focused minutes — future you will thank you."


def _offline_dna(db: Session) -> str:
    dna = analytics.learning_dna(db)
    if dna.get("empty"):
        return dna["summary"]
    lines = ["**Your Learning DNA** (built from the last 90 days of real data):", ""]
    bh = dna.get("best_hours", [])
    if bh:
        h = bh[0]["hour"]
        lines.append(f"🕗 Best study time: around {h:02d}:00")
    il = dna.get("ideal_length_min")
    if il:
        lines.append(f"⏱️ Ideal session length: ~{il} minutes")
    ss = dna.get("strongest_subjects")
    if ss:
        lines.append(f"🧠 Best retention: {ss[0]['subject']}")
    st = dna.get("struggling_topics")
    if st:
        lines.append(f"⚠️ Needs work: {st[0]['subject']} — {st[0]['topic']}")
    ls = dna.get("learning_style", {})
    if ls.get("hint"):
        lines.append(f"💡 Style: {ls['hint']}")
    lines.append("")
    lines.append(dna["summary"])
    return "\n".join(lines)


def _offline_weak(db: Session) -> str:
    wt = analytics.weak_topics(db, limit=5)
    if not wt:
        return "No weak topics detected yet. Study with topics attached and set mastery ratings — I'll spot patterns."
    lines = ["Weak topics detected (by score):"]
    for w in wt:
        reasons = ", ".join(w["reasons"])
        lines.append(f"- **{w['topic']}** ({w['subject']}) — mastery {w['mastery']:.0%}, {w['minutes']} min studied ({reasons})")
    lines.append("\nTip: revise the top 2 in short sessions, then quiz yourself.")
    return "\n".join(lines)


def _offline_burnout(db: Session) -> str:
    b = analytics.burnout_index(db)
    head = f"Burnout risk: **{b['level'].upper()}** ({b['risk']}/100)"
    lines = [head, f"- Hours studied this week: {b['total_hours']}"]
    for r in b["reasons"]:
        lines.append(f"- {r}")
    lines.append(f"- Advice: {b['tip']}")
    return "\n".join(lines)


# --------------------------------------------------------------------------
# public API used by routers
# ----------------------------------------
def chat(db: Session, message: str, history: list[dict]) -> tuple[str, bool]:
    if ollama_available():
        msgs = [_system("You are StudyOS, a friendly offline AI study companion. Be concise, warm and practical.")]
        msgs += history[-8:]
        msgs.append({"role": "user", "content": message})
        resp = _chat(msgs, settings.ollama_url, settings.ollama_model)
        if resp:
            return resp.strip(), True
    return _offline_chat(db, message) + OFFLINE_NOTICE, False


def summarize(db: Session, text: str) -> tuple[str, bool]:
    prompt = f"Summarize the following study notes into clear bullet points:\n\n{text[:8000]}"
    return _try_ai(prompt, "You are a precise summarizer.", db, "summarize")


def quiz(db: Session, topic: str, count: int, kind: str) -> tuple[str, bool]:
    prompt = f"Create {count} {kind} quiz questions on the topic '{topic}' with answers and a short explanation."
    return _try_ai(prompt, "You are an expert quiz maker for students.", db, "quiz")


def plan(db: Session, prompt_hint: str) -> tuple[str, bool]:
    return _try_ai("Create a focused daily study plan from this context: " + prompt_hint, "You are a study planner.", db, "plan")


def motivate(db: Session) -> tuple[str, bool]:
    return _try_ai("Give a short, warm motivational message based on consistent studying.", "You are an encouraging study buddy.", db, "motivate")


def learning_dna_report(db: Session) -> dict:
    dna = analytics.learning_dna(db)
    if not dna.get("empty") and ollama_available():
        summary = _generate(
            "In 2-3 friendly sentences, advise this student based on their learning profile: " + json.dumps(dna, default=str),
            settings.ollama_url,
            settings.ollama_model,
        )
        if summary:
            dna["ai_advice"] = summary.strip()
    return dna


def weak_topics_report(db: Session) -> list[dict]:
    return analytics.weak_topics(db, limit=5)


def burnout_report(db: Session) -> dict:
    return analytics.burnout_index(db)


def ai_status() -> dict:
    ok = ollama_available()
    models: list[str] = []
    if ok:
        try:
            r = httpx.get(f"{settings.ollama_url}/api/tags", timeout=2.0)
            models = [m["name"] for m in r.json().get("models", [])]
        except Exception:
            pass
    return {
        "ollama_available": ok,
        "ollama_url": settings.ollama_url,
        "configured_model": settings.ollama_model,
        "installed_models": models,
    }
