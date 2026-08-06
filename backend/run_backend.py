"""Entry point for the packaged backend (PyInstaller).

Imports the FastAPI app object directly so PyInstaller's static analysis
can follow it and bundle all of app.* correctly.
"""
import uvicorn

from app.main import app  # noqa: E402

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning")
