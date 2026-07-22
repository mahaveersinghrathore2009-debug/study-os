"""StudyOS local backend — offline-first FastAPI server on 127.0.0.1."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import ai_service
from .config import settings
from .database import Base, engine
from .routers import (
    ai,
    analytics,
    backup,
    calendar,
    dashboard,
    flashcards,
    goals,
    mood_journal,
    notes,
    settings as settings_router,
    study,
    subjects,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
log = logging.getLogger("studyos")


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    log.info("StudyOS database ready at %s", settings.database_url)
    if ai_service.ollama_available():
        log.info("Ollama detected at %s", settings.ollama_url)
    else:
        log.info("Ollama not running — offline engine active (fully functional)")
    yield


app = FastAPI(
    title="StudyOS",
    description="The Offline AI Study Companion That Respects Your Privacy.",
    version=settings.version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (
    subjects.router,
    study.router,
    dashboard.router,
    goals.router,
    calendar.router,
    notes.router,
    flashcards.router,
    mood_journal.router,
    analytics.router,
    ai.router,
    settings_router.router,
    backup.router,
):
    app.include_router(router)


@app.get("/")
def root():
    return {"app": settings.app_name, "version": settings.version, "docs": "/docs", "health": "/health"}


@app.get("/health")
def health():
    return {"status": "ok", "ollama": ai_service.ollama_available(), "version": settings.version}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=False)
