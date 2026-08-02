import json
from datetime import datetime

from cryptography.fernet import Fernet
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import inspect, text

from ..config import BACKUP_DIR, DATA_DIR
from ..database import SessionLocal, engine

router = APIRouter(prefix="/api/backup", tags=["backup"])

KEY_FILE = DATA_DIR / "backup.key"


def _get_key() -> bytes:
    if KEY_FILE.exists():
        return KEY_FILE.read_bytes()
    key = Fernet.generate_key()
    KEY_FILE.write_bytes(key)
    return key


class RestoreRequest(BaseModel):
    filename: str


@router.get("/list")
def list_backups():
    files = sorted(BACKUP_DIR.glob("*.enc"), reverse=True)
    return [
        {
            "filename": f.name,
            "size": f.stat().st_size,
            "created": datetime.fromtimestamp(f.stat().st_mtime).isoformat(),
        }
        for f in files
    ]


@router.post("/export")
def export_backup():
    """Encrypt a full JSON dump of every table into data/backups/."""
    f = Fernet(_get_key())
    dump: dict[str, list[dict]] = {}
    inspector = inspect(engine)
    with SessionLocal() as db:
        for table in inspector.get_table_names():
            rows = db.execute(text(f'SELECT * FROM "{table}"')).mappings().all()
            dump[table] = [dict(r) for r in rows]
    blob = json.dumps(dump, default=str).encode("utf-8")
    encrypted = f.encrypt(blob)
    name = f"studyos-backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}.enc"
    (BACKUP_DIR / name).write_bytes(encrypted)
    return {"filename": name, "bytes": len(encrypted), "tables": list(dump.keys())}


def _fk_ordered_tables() -> list[str]:
    """Tables topologically sorted: parents before children (FK-aware).

    The default alphabetical table order breaks INSERTs: a child table
    (e.g. flashcards -> subjects/topics) would be restored before its
    parents exist, tripping the foreign-key check.
    """
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    refs: dict[str, set[str]] = {t: set() for t in tables}
    for t in tables:
        for fk in inspector.get_foreign_keys(t):
            ref = fk.get("referred_table")
            if ref and ref in refs:
                refs[t].add(ref)

    order: list[str] = []
    visited: set[str] = set()

    def visit(t: str, stack: set[str]) -> None:
        if t in visited:
            return
        if t in stack:  # cycle guard (should not happen)
            return
        stack.add(t)
        for parent in refs.get(t, ()):
            visit(parent, stack)
        stack.discard(t)
        visited.add(t)
        order.append(t)

    for t in tables:
        visit(t, set())
    return order


@router.post("/restore")
def restore_backup(payload: RestoreRequest):
    path = BACKUP_DIR / payload.filename
    if not path.exists() or path.suffix != ".enc":
        raise HTTPException(404, "Backup not found")
    f = Fernet(_get_key())
    try:
        dump = json.loads(f.decrypt(path.read_bytes()))
    except Exception:
        raise HTTPException(400, "Could not decrypt backup (wrong key or corrupted file)")
    ordered = _fk_ordered_tables()
    with SessionLocal() as db:
        # children first, so CASCADE/restraints never block the wipe
        for table in reversed(ordered):
            db.execute(text(f'DELETE FROM "{table}"'))
        # parents first, so FKs are satisfied at INSERT time
        for table in ordered:
            for row in dump.get(table, []):
                cols = ", ".join(f'"{k}"' for k in row.keys())
                vals = ", ".join(":" + k for k in row.keys())
                db.execute(text(f'INSERT INTO "{table}" ({cols}) VALUES ({vals})'), row)
        db.commit()
    return {"ok": True, "tables": list(dump.keys())}
