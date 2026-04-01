"use client";

import { useEffect, useCallback } from "react";
import { useTerminal } from "@/lib/terminal/workspace";

interface UseKeyboardShortcutsOptions {
  onOpenSearch: () => void;
  onToggleFullscreen: () => void;
  onOpenOrderModal: (side: "buy" | "sell") => void;
}

export function useKeyboardShortcuts({
  onOpenSearch,
  onToggleFullscreen,
  onOpenOrderModal,
}: UseKeyboardShortcutsOptions) {
  const {
    state,
    dispatch,
    setSymbol,
    addDrawing,
    removeDrawing,
    updateDrawing,
    clearDrawings,
  } = useTerminal();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;

      if (isMeta && e.key === "k") {
        e.preventDefault();
        onOpenSearch();
        return;
      }

      if (isMeta && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        return;
      }

      if (isMeta && e.key === "z") {
        e.preventDefault();
        return;
      }

      if (isMeta && e.key === "s") {
        e.preventDefault();
        return;
      }

      if (e.key === "Escape") {
        if (state.selectedDrawing) {
          dispatch({ type: "SET_SELECTED_DRAWING", id: null });
        } else if (state.selectedDrawingTool) {
          dispatch({ type: "SET_DRAWING_TOOL", tool: null });
        }
        return;
      }

      if (e.key === "b" && !isMeta) {
        e.preventDefault();
        onOpenOrderModal("buy");
        return;
      }

      if (e.key === "s" && !isMeta) {
        e.preventDefault();
        onOpenOrderModal("sell");
        return;
      }

      if (e.key === "f" && !isMeta) {
        e.preventDefault();
        onToggleFullscreen();
        return;
      }

      if (e.key === "h" && !isMeta) {
        e.preventDefault();
        if (state.selectedDrawing) {
          updateDrawing(state.selectedDrawing, {
            visible: !state.drawings.find((d) => d.id === state.selectedDrawing)?.visible,
          });
        }
        return;
      }

      if (e.key === "l" && !isMeta) {
        e.preventDefault();
        if (state.selectedDrawing) {
          updateDrawing(state.selectedDrawing, {
            locked: !state.drawings.find((d) => d.id === state.selectedDrawing)?.locked,
          });
        }
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (state.selectedDrawing && !isMeta) {
          e.preventDefault();
          removeDrawing(state.selectedDrawing);
        }
        return;
      }

      if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        return;
      }

      if (e.key === "-") {
        e.preventDefault();
        return;
      }

      if (e.key === "ArrowLeft" && !isMeta) {
        e.preventDefault();
        dispatch({ type: "SET_HOVERED_CANDLE", index: Math.max(0, (state.hoveredCandleIndex ?? state.chartData.length - 1) - 1) });
        return;
      }

      if (e.key === "ArrowRight" && !isMeta) {
        e.preventDefault();
        dispatch({ type: "SET_HOVERED_CANDLE", index: Math.min(state.chartData.length - 1, (state.hoveredCandleIndex ?? state.chartData.length - 1) + 1) });
        return;
      }

      if (e.key >= "1" && e.key <= "9" && !isMeta) {
        const timeframes = ["1m", "3m", "5m", "15m", "30m", "1h", "4h", "1D", "1W"] as const;
        const idx = parseInt(e.key) - 1;
        if (idx < timeframes.length) {
          dispatch({ type: "SET_TIMEFRAME", timeframe: timeframes[idx] });
        }
        return;
      }
    },
    [
      onOpenSearch,
      onToggleFullscreen,
      onOpenOrderModal,
      state.selectedDrawing,
      state.selectedDrawingTool,
      state.drawings,
      state.hoveredCandleIndex,
      state.chartData.length,
      dispatch,
      addDrawing,
      removeDrawing,
      updateDrawing,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
