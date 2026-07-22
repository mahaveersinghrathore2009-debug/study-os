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
    with SessionLocal() as db:
        for table in reversed(inspect(engine).get_table_names()):
            db.execute(text(f'DELETE FROM "{table}"'))
        for table, rows in dump.items():
            for row in rows:
                cols = ", ".join(f'"{k}"' for k in row.keys())
                vals = ", ".join(":" + k for k in row.keys())
                db.execute(text(f'INSERT INTO "{table}" ({cols}) VALUES ({vals})'), row)
        db.commit()
    return {"ok": True, "tables": list(dump.keys())}
