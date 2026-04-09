from __future__ import annotations

from app.core.artifacts import ArtifactRegistry
from app.core.cache import TTLCache
from app.core.settings import get_settings
from app.services.backend_service import StockXpertBackendService


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
