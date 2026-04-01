"use client";

import { useEffect, useRef, useCallback } from "react";
import { useTerminal } from "@/lib/terminal/workspace";

interface UseWebSocketOptions {
  url?: string;
  onMessage?: (data: unknown) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export function useWebSocket({
  url,
  onMessage,
  reconnectAttempts = 5,
  reconnectInterval = 3000,
}: UseWebSocketOptions = {}) {
  const { dispatch } = useTerminal();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!url) return;

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        dispatch({ type: "SET_WS_CONNECTED", connected: true });
        reconnectCountRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "ticker") {
            // Handle ticker updates
            console.log("Ticker update:", data);
          } else if (data.type === "trade") {
            // Handle trade updates
            console.log("Trade update:", data);
          } else if (data.type === "orderbook") {
            // Handle orderbook updates
            console.log("Orderbook update:", data);
          }

          onMessage?.(data);
        } catch (e) {
          console.error("Failed to parse WebSocket message:", e);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.onclose = () => {
        dispatch({ type: "SET_WS_CONNECTED", connected: false });

        if (reconnectCountRef.current < reconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectCountRef.current++;
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current = ws;
    } catch (e) {
      console.error("Failed to create WebSocket:", e);
    }
  }, [url, onMessage, reconnectAttempts, reconnectInterval, dispatch]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    ws: wsRef.current,
    send,
    disconnect,
    reconnect: connect,
  };
}

export function useRealtimePrices(symbols: string[]) {
  const { dispatch } = useTerminal();
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastUpdateRef.current < 1000) return;
      lastUpdateRef.current = now;

      dispatch({
        type: "SET_WATCHLIST",
        watchlist: symbols.map((symbol) => ({
          symbol,
          name: symbol,
          price: Math.random() * 1000 + 1000,
          change: (Math.random() - 0.5) * 20,
          changePct: (Math.random() - 0.5) * 2,
          exchange: "NSE",
          lastUpdate: now,
        })),
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [symbols, dispatch]);
}
