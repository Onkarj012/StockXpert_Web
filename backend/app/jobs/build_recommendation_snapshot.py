from __future__ import annotations

from backend.app.core.artifacts import ArtifactRegistry
from backend.app.core.cache import TTLCache
from backend.app.core.settings import get_settings
from backend.app.services.backend_service import StockXpertBackendService


def main() -> None:
    settings = get_settings()
    artifacts = ArtifactRegistry(settings)
    service = StockXpertBackendService(settings=settings, artifacts=artifacts, cache=TTLCache())
    result = service.build_recommendation_snapshot()
    print(
        "Recommendation snapshot built",
        f"path={result['path']}",
        f"market_date={result['market_date']}",
        f"horizons={result['horizons']}",
    )


if __name__ == "__main__":
    main()
