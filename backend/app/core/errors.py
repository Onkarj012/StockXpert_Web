from __future__ import annotations


class BackendError(Exception):
    """Base class for backend-specific failures."""


class ArtifactError(BackendError):
    """Raised when the model bundle is incomplete or invalid."""


class InvalidSymbolError(BackendError):
    """Raised when a request references symbols outside the trained universe."""


class DataUnavailableError(BackendError):
    """Raised when market data cannot be fetched or prepared for inference."""
