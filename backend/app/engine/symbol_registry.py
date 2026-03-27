from __future__ import annotations

from backend.app.core.errors import InvalidSymbolError


class SymbolRegistry:
    def __init__(self, trained_symbols: list[str]) -> None:
        self._trained_symbols = list(trained_symbols)
        self._lookup = {symbol.upper(): idx for idx, symbol in enumerate(self._trained_symbols)}

    @property
    def symbols(self) -> list[str]:
        return list(self._trained_symbols)

    def normalize(self, symbol: str) -> str:
        cleaned = symbol.strip().upper()
        if cleaned.endswith(".NS") or cleaned.endswith(".BO"):
            return cleaned
        return f"{cleaned}.NS"

    def validate(self, symbols: list[str] | None) -> list[str]:
        if not symbols:
            return self.symbols
        normalized = [self.normalize(symbol) for symbol in symbols]
        invalid = [symbol for symbol in normalized if symbol not in self._lookup]
        if invalid:
            raise InvalidSymbolError(f"Symbols outside trained universe: {', '.join(invalid)}")
        return normalized

    def index_for(self, symbol: str) -> int:
        normalized = self.normalize(symbol)
        try:
            return self._lookup[normalized]
        except KeyError as exc:
            raise InvalidSymbolError(f"Unknown symbol: {normalized}") from exc
