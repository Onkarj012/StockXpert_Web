from __future__ import annotations

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.artifacts import ArtifactRegistry
from app.core.cache import TTLCache
from app.core.logging import configure_logging
from app.core.settings import get_settings
from app.routers.admin import router as admin_router
from app.routers.dashboard import router as dashboard_router
from app.routers.health import router as health_router
from app.routers.metadata import router as metadata_router
from app.routers.recommendations import router as recommendations_router
from app.routers.stocks import router as stocks_router
from app.schemas import RootResponse
from app.services.backend_service import StockXpertBackendService
from app.services.snapshot_scheduler import SnapshotScheduler

configure_logging()
logger = logging.getLogger("stockxpert.backend")

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    artifacts = ArtifactRegistry(settings)
    cache = TTLCache()
    service = StockXpertBackendService(settings=settings, artifacts=artifacts, cache=cache)
    scheduler = None
    if settings.snapshot_schedule_enabled:
        scheduler = SnapshotScheduler(
            service,
            timezone=settings.market_timezone,
            catch_up_on_startup=settings.snapshot_catch_up_on_startup,
            hour=settings.snapshot_schedule_hour,
            minute=settings.snapshot_schedule_minute,
        )
        scheduler.start()
    app.state.backend_service = service
    app.state.snapshot_scheduler = scheduler
    logger.info("Backend started with bundle dir: %s", artifacts.paths.bundle_dir)
    yield
    if scheduler is not None:
        scheduler.stop()


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

if settings.cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.get("/", response_model=RootResponse, tags=["health"])
def root() -> RootResponse:
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "openapi": "/docs",
    }


app.include_router(health_router)
app.include_router(admin_router)
app.include_router(metadata_router)
app.include_router(dashboard_router)
app.include_router(recommendations_router)
app.include_router(stocks_router)
