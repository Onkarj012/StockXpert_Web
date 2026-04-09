from __future__ import annotations

from fastapi import APIRouter, Depends

from app.deps import get_service
from app.schemas import MetadataConfigResponse
from app.services.backend_service import StockXpertBackendService

router = APIRouter(prefix="/api/metadata", tags=["metadata"])


@router.get("/config", response_model=MetadataConfigResponse)
def metadata_config(service: StockXpertBackendService = Depends(get_service)) -> MetadataConfigResponse:
    return service.metadata_config()
