from __future__ import annotations


def filter_side(cards: list[dict], side: str) -> list[dict]:
    normalized = side.lower()
    if normalized == "both":
        return cards
    return [card for card in cards if card.get("direction") == normalized]


def sort_cards(cards: list[dict]) -> list[dict]:
    return sorted(
        cards,
        key=lambda card: (
            card.get("confidence_pct") or 0.0,
            abs(card.get("expected_return_pct") or 0.0),
        ),
        reverse=True,
    )
