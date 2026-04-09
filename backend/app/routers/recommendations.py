from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.errors import DataUnavailableError, OperationNotAllowedError
from app.core.settings import get_settings
from app.deps import get_service
from app.schemas import RecommendationsByHorizonResponse, RecommendationsResponse
from app.services.backend_service import StockXpertBackendService

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
    live: bool = Query(default=False, description="force live model inference instead of saved snapshot"),
    service: StockXpertBackendService = Depends(get_service),
) -> RecommendationsResponse:
    settings = get_settings()
    try:
        return service.get_recommendations(
            symbols=[value.strip() for value in symbols.split(",")] if symbols else None,
            horizon=horizon or settings.default_horizon,
            top_n=top_n or settings.default_top_n,
            side=side,
            prefer_saved=not live,
            force_live=live,
        )
    except DataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except OperationNotAllowedError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.get(
    "/recommendations/horizons",
    response_model=RecommendationsByHorizonResponse,
    summary="Get recommendation feeds for all supported horizons",
)
def recommendations_by_horizon(
    symbols: str | None = Query(default=None, description="comma-separated subset of trained symbols"),
    top_n: int | None = Query(default=None, ge=1, le=50),
    side: str = Query(default="both", description="long|short|both"),
    live: bool = Query(default=False, description="force live model inference instead of saved snapshot"),
    service: StockXpertBackendService = Depends(get_service),
) -> RecommendationsByHorizonResponse:
    settings = get_settings()
    try:
        return service.get_recommendations_by_horizon(
            symbols=[value.strip() for value in symbols.split(",")] if symbols else None,
            top_n=top_n or settings.default_top_n,
            side=side,
            prefer_saved=not live,
            force_live=live,
        )
    except DataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except OperationNotAllowedError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
