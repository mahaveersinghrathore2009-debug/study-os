"""Headless behavioral check for StudyOS — drives the live API and asserts real state transitions.

Run: .venv/Scripts/python.exe tests/lifecycle_check.py
Creates + cleans up its own test data. Exits non-zero on any failed assertion.
"""
import json
import sys
import urllib.request

BASE = "http://127.0.0.1:8000"
PASS, FAIL = 0, 0


def req(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(BASE + path, data=data, method=method)
    if body is not None:
        r.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(r, timeout=60) as resp:
        raw = resp.read().decode()
        return resp.status, (json.loads(raw) if raw else None)


def check(name, cond, detail=""):
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  \u2705 {name}")
    else:
        FAIL += 1
        print(f"  \u274c {name} {detail}")


print("=== 1. Server & AI status ===")
st, h = req("GET", "/health")
check("health endpoint responds", st == 200, f"got {st}")
st, s = req("GET", "/api/ai/status")
check("ollama available", st == 200 and s.get("ollama_available") is True)
check("qwen2.5:7b installed", "qwen2.5:7b" in s.get("installed_models", []), str(s.get("installed_models")))

print("=== 2. Subject hierarchy ===")
st, subj = req("POST", "/api/subjects", {"name": "ZZ Lifecycle Test", "color": "#f97316", "icon": "🧪"})
check("subject created", st == 200 and subj["id"], str(subj))
sid = subj["id"]
st, ch = req("POST", "/api/subjects/topics", {"subject_id": sid, "name": "Chapter A"})
check("chapter (top-level topic) created", st == 200 and ch["parent_id"] is None, str(ch))
st, tp = req("POST", "/api/subjects/topics", {"subject_id": sid, "parent_id": ch["id"], "name": "Subtopic 1"})
check("subtopic nested under chapter", st == 200 and tp["parent_id"] == ch["id"], str(tp))
st, tree = req("GET", "/api/subjects")
node = next((x for x in tree if x["id"] == sid), None)
check("subject tree nests chapter -> subtopic",
      node and node["topics"][0]["name"] == "Chapter A" and node["topics"][0]["children"][0]["name"] == "Subtopic 1")

print("=== 3. Study session lifecycle ===")
st, run = req("POST", "/api/sessions/start", {"subject_id": sid, "topic_id": tp["id"], "mood": 4, "difficulty": 4})
check("session starts", st == 200 and run["status"] == "running", str(run))
sid2 = run["id"]
st, fin = req("POST", f"/api/sessions/{sid2}/finish", {"duration_seconds": 1500, "mood": 4, "difficulty": 4})
check("session finishes with 25:00 recorded", st == 200 and fin["status"] == "finished" and fin["duration_seconds"] == 1500, str(fin))
st, dash = req("GET", "/api/dashboard")
check("dashboard counts session today", dash["today"]["sessions"] >= 1 and dash["today"]["minutes"] >= 25, str(dash["today"]))

print("=== 4. Learning DNA reacts to data ===")
st, dna = req("GET", "/api/analytics/learning-dna")
check("best study hours detected", bool(dna.get("best_hours")), str(dna.get("best_hours")))
check("strongest subject is the test subject", any(x["subject"] == "ZZ Lifecycle Test" for x in dna.get("strongest_subjects", [])), str(dna.get("strongest_subjects")))

print("=== 5. Flashcards: spaced repetition (SM-2) ===")
st, card = req("POST", "/api/flashcards", {"subject_id": sid, "topic_id": tp["id"], "front": "F?", "back": "A."})
check("card created due today", st == 200 and card["id"], str(card))
cid = card["id"]
st, card2 = req("GET", "/api/flashcards")
due0 = next((c for c in card2 if c["id"] == cid), None)
check("card is in due list (interval 0)", due0 and due0.get("interval_days") == 0, str(due0))
st, rv = req("POST", f"/api/flashcards/{cid}/review", {"rating": "good"})
check("SM-2 'good' bumps interval", st == 200 and rv["interval_days"] == 1 and rv["reviews"] == 1, str(rv))
st, rv2 = req("POST", f"/api/flashcards/{cid}/review", {"rating": "again"})
check("SM-2 'again' resets to 0", st == 200 and rv2["interval_days"] == 0 and rv2["reviews"] == 2, str(rv2))

print("=== 6. Backup: encrypt -> list -> restore ===")
st, bk = req("POST", "/api/backup/export")
check("encrypted backup exported", st == 200 and bk.get("filename") and bk.get("bytes", 0) > 100, str(bk))
st, lst = req("GET", "/api/backup/list")
check("backup appears in list", any(b.get("filename") == bk["filename"] for b in lst), str(lst))
st, rs = req("POST", "/api/backup/restore", {"filename": bk["filename"]})
check("backup restores cleanly", st == 200 and rs.get("ok") is True, str(rs))

print("=== 7. Mood feeds burnout engine ===")
st, mood = req("POST", "/api/mood", {"entry_date": "2026-08-06", "mood": 2, "energy": 2, "note": "tired"})
check("mood logged", st == 200, str(mood))
st, burn = req("GET", "/api/analytics/overview")
check("analytics overview still healthy with mood data", st == 200 and "burnout_index" in burn, str(burn.get("burnout"))[:120] if isinstance(burn, dict) else str(burn))

print("=== 8. Cleanup ===")
for p in (f"/api/flashcards/{cid}", f"/api/sessions/{sid2}", f"/api/subjects/{sid}"):
    try:
        req("DELETE", p)
    except Exception:
        pass
st, subjects = req("GET", "/api/subjects")
check("test subject removed", all(x["id"] != sid for x in subjects))
st, cards = req("GET", "/api/flashcards")
check("test card removed", all(c["id"] != cid for c in cards))

print(f"\nRESULT: {PASS} passed, {FAIL} failed")
sys.exit(1 if FAIL else 0)
