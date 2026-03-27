from __future__ import annotations

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI

from backend.app.core.artifacts import ArtifactRegistry
from backend.app.core.cache import TTLCache
from backend.app.core.logging import configure_logging
from backend.app.core.settings import get_settings
from backend.app.routers.dashboard import router as dashboard_router
from backend.app.routers.health import router as health_router
from backend.app.routers.metadata import router as metadata_router
from backend.app.routers.recommendations import router as recommendations_router
from backend.app.routers.stocks import router as stocks_router
from backend.app.schemas import RootResponse
from backend.app.services.backend_service import StockXpertBackendService

configure_logging()
logger = logging.getLogger("stockxpert.backend")

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    artifacts = ArtifactRegistry(settings)
    cache = TTLCache()
    service = StockXpertBackendService(settings=settings, artifacts=artifacts, cache=cache)
    app.state.backend_service = service
    logger.info("Backend started with bundle dir: %s", artifacts.paths.bundle_dir)
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "FastAPI backend for StockXpert. Exposes model-backed recommendations, "
        "dashboard summaries, and stock deep-dive analytics for the frontend."
    ),
    openapi_tags=[
        {"name": "health", "description": "Runtime health and artifact readiness."},
        {"name": "metadata", "description": "Model and artifact metadata exposed to the UI."},
        {"name": "dashboard", "description": "Aggregated dashboard payload for the main application shell."},
        {"name": "recommendations", "description": "Checkpoint-backed recommendation feeds."},
        {"name": "stocks", "description": "Per-stock deep dive, charts, and model inference views."},
    ],
    lifespan=lifespan,
)


@app.get("/", response_model=RootResponse, tags=["health"])
def root() -> RootResponse:
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "openapi": "/docs",
    }


app.include_router(health_router)
app.include_router(metadata_router)
app.include_router(dashboard_router)
app.include_router(recommendations_router)
app.include_router(stocks_router)
