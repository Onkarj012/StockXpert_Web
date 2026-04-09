from __future__ import annotations

from pathlib import Path

# Allow `uvicorn app.main:app` from the repository root by pointing this
# package at the backend application source tree.
__path__ = [str(Path(__file__).resolve().parents[1] / "backend" / "app")]
