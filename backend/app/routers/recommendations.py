from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from backend.app.core.settings import get_settings
from backend.app.deps import get_service
from backend.app.schemas import RecommendationsResponse
from backend.app.services.backend_service import StockXpertBackendService

router = APIRouter(prefix="/api", tags=["recommendations"])


@router.get(
    "/recommendations",
    response_model=RecommendationsResponse,
    summary="Get merged recommendation feed",
)
def recommendations(
    symbols: str | None = Query(default=None, description="comma-separated subset of trained symbols"),
    horizon: int | None = Query(default=None, description="prediction horizon in trading days"),
    top_n: int | None = Query(default=None, ge=1, le=50),
    side: str = Query(default="both", description="long|short|both"),
    service: StockXpertBackendService = Depends(get_service),
) -> RecommendationsResponse:
    settings = get_settings()
    return service.get_recommendations(
        symbols=[value.strip() for value in symbols.split(",")] if symbols else None,
        horizon=horizon or settings.default_horizon,
        top_n=top_n or settings.default_top_n,
        side=side,
    )
