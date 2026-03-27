from __future__ import annotations

from fastapi import Request

from backend.app.services.backend_service import StockXpertBackendService


def get_service(request: Request) -> StockXpertBackendService:
    return request.app.state.backend_service
