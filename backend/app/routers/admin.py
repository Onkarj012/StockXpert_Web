from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.core.settings import get_settings
from app.deps import get_service
from app.services.backend_service import StockXpertBackendService

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/snapshots/rebuild", summary="Build and persist the daily recommendation snapshot")
def rebuild_snapshot(
    x_snapshot_token: str | None = Header(default=None),
    service: StockXpertBackendService = Depends(get_service),
) -> dict[str, object]:
    settings = get_settings()
    expected_token = settings.snapshot_trigger_token

    if not expected_token:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Snapshot rebuild endpoint is not configured.",
        )

    if x_snapshot_token != expected_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid snapshot trigger token.",
        )

    return service.build_recommendation_snapshot()
