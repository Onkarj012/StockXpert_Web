from __future__ import annotations

from fastapi import APIRouter, Depends

from backend.app.deps import get_service
from backend.app.schemas import HealthResponse
from backend.app.services.backend_service import StockXpertBackendService

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health(service: StockXpertBackendService = Depends(get_service)) -> HealthResponse:
    return service.health()
