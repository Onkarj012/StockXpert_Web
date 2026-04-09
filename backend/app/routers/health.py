from __future__ import annotations

from fastapi import APIRouter, Depends

from app.deps import get_service
from app.schemas import HealthResponse
from app.services.backend_service import StockXpertBackendService

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health(service: StockXpertBackendService = Depends(get_service)) -> HealthResponse:
    return service.health()
