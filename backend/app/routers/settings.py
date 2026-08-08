from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Setting
from ..schemas import SettingsOut, SettingsUpdate

router = APIRouter(prefix="/api/settings", tags=["settings"])

DEFAULTS: dict[str, str] = {
    "profile_name": "Student",
    "theme": "dark",
    "accent": "indigo",
    "font_scale": "1.0",
    "pomodoro_focus": "25",
    "pomodoro_break": "5",
    "pomodoro_long_break": "15",
    "daily_goal_hours": "2.0",
    "weekly_goal_hours": "14.0",
    "ollama_url": "http://127.0.0.1:11434",
    "ollama_model": "qwen2.5:7b",
    "high_contrast": "false",
}


def _map(rows: list[Setting]) -> dict:
    store = {s.key: s.value for s in rows}
    merged = {**DEFAULTS, **store}
    return SettingsOut(
        profile_name=merged["profile_name"],
        theme=merged["theme"],
        accent=merged["accent"],
        font_scale=float(merged["font_scale"]),
        pomodoro_focus=int(merged["pomodoro_focus"]),
        pomodoro_break=int(merged["pomodoro_break"]),
        pomodoro_long_break=int(merged["pomodoro_long_break"]),
        daily_goal_hours=float(merged["daily_goal_hours"]),
        weekly_goal_hours=float(merged["weekly_goal_hours"]),
        ollama_url=merged["ollama_url"],
        ollama_model=merged["ollama_model"],
        high_contrast=merged["high_contrast"] == "true",
    )


@router.get("", response_model=SettingsOut)
def get_settings(db: Session = Depends(get_db)):
    return _map(db.query(Setting).all())


@router.put("", response_model=SettingsOut)
def update_settings(payload: SettingsUpdate, db: Session = Depends(get_db)):
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        row = db.get(Setting, key)
        if row:
            row.value = str(value)
        else:
            db.add(Setting(key=key, value=str(value)))
    db.commit()
    return _map(db.query(Setting).all())
