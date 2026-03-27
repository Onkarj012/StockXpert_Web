from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from backend.app.deps import get_service
from backend.app.schemas import StockChartResponse, StockDeepDiveResponse
from backend.app.services.backend_service import StockXpertBackendService

router = APIRouter(prefix="/api/stocks", tags=["stocks"])


@router.get("/{ticker}", response_model=StockDeepDiveResponse)
def stock_deep_dive(
    ticker: str,
    lookback: int = Query(default=60, ge=30, le=365),
    service: StockXpertBackendService = Depends(get_service),
) -> StockDeepDiveResponse:
    try:
        return service.stock_deep_dive(ticker=ticker, lookback=lookback)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{ticker}/chart", response_model=StockChartResponse)
def stock_chart(
    ticker: str,
    lookback: int = Query(default=60, ge=30, le=365),
    service: StockXpertBackendService = Depends(get_service),
) -> StockChartResponse:
    try:
        return service.stock_chart(ticker=ticker, lookback=lookback)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
