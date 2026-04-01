"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import type {
  ChartPoint,
  IndicatorConfig,
  DrawingObject,
  Alert,
  Order,
  Position,
  Workspace,
  ChartType,
  ChartLayout,
  Timeframe,
  TickerData,
} from "@/types/terminal";
import type { CrosshairState, PriceScale } from "@/types/terminal";

interface TerminalState {
  symbol: string;
  exchange: string;
  timeframe: Timeframe;
  chartType: ChartType;
  chartData: ChartPoint[];
  indicators: IndicatorConfig[];
  drawings: DrawingObject[];
  alerts: Alert[];
  positions: Position[];
  orders: Order[];
  watchlist: TickerData[];
  crosshair: CrosshairState | null;
  priceScale: PriceScale;
  layout: ChartLayout;
  theme: "dark" | "light";
  sidebarOpen: boolean;
  sidebarWidth: number;
  navCollapsed: boolean;
  selectedDrawingTool: string | null;
  selectedDrawing: string | null;
  hoveredCandleIndex: number | null;
  visibleIndicatorPanes: string[];
  wsConnected: boolean;
}

type TerminalAction =
  | { type: "SET_SYMBOL"; symbol: string; exchange?: string }
  | { type: "SET_TIMEFRAME"; timeframe: Timeframe }
  | { type: "SET_CHART_TYPE"; chartType: ChartType }
  | { type: "SET_CHART_DATA"; data: ChartPoint[] }
  | { type: "ADD_INDICATOR"; indicator: IndicatorConfig }
  | { type: "UPDATE_INDICATOR"; id: string; updates: Partial<IndicatorConfig> }
  | { type: "REMOVE_INDICATOR"; id: string }
  | { type: "ADD_DRAWING"; drawing: DrawingObject }
  | { type: "UPDATE_DRAWING"; id: string; updates: Partial<DrawingObject> }
  | { type: "REMOVE_DRAWING"; id: string }
  | { type: "CLEAR_DRAWINGS" }
  | { type: "ADD_ALERT"; alert: Alert }
  | { type: "UPDATE_ALERT"; id: string; updates: Partial<Alert> }
  | { type: "REMOVE_ALERT"; id: string }
  | { type: "SET_POSITIONS"; positions: Position[] }
  | { type: "SET_ORDERS"; orders: Order[] }
  | { type: "ADD_ORDER"; order: Order }
  | { type: "UPDATE_ORDER"; id: string; updates: Partial<Order> }
  | { type: "SET_WATCHLIST"; watchlist: TickerData[] }
  | { type: "SET_CROSSHAIR"; crosshair: CrosshairState | null }
  | { type: "SET_PRICE_SCALE"; scale: Partial<PriceScale> }
  | { type: "SET_LAYOUT"; layout: ChartLayout }
  | { type: "SET_THEME"; theme: "dark" | "light" }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_SIDEBAR_WIDTH"; width: number }
  | { type: "TOGGLE_NAV" }
  | { type: "SET_DRAWING_TOOL"; tool: string | null }
  | { type: "SET_SELECTED_DRAWING"; id: string | null }
  | { type: "SET_HOVERED_CANDLE"; index: number | null }
  | { type: "TOGGLE_INDICATOR_PANE"; pane: string }
  | { type: "SET_WS_CONNECTED"; connected: boolean }
  | { type: "LOAD_WORKSPACE"; workspace: Workspace };

const initialState: TerminalState = {
  symbol: "RELIANCE.NS",
  exchange: "NSE",
  timeframe: "1D",
  chartType: "candle",
  chartData: [],
  indicators: [],
  drawings: [],
  alerts: [],
  positions: [],
  orders: [],
  watchlist: [],
  crosshair: null,
  priceScale: { min: 0, max: 0, mode: "auto" },
  layout: "1x1",
  theme: "dark",
  sidebarOpen: true,
  sidebarWidth: 320,
  navCollapsed: false,
  selectedDrawingTool: null,
  selectedDrawing: null,
  hoveredCandleIndex: null,
  visibleIndicatorPanes: [],
  wsConnected: false,
};

function terminalReducer(
  state: TerminalState,
  action: TerminalAction
): TerminalState {
  switch (action.type) {
    case "SET_SYMBOL":
      return { ...state, symbol: action.symbol, exchange: action.exchange ?? state.exchange };
    case "SET_TIMEFRAME":
      return { ...state, timeframe: action.timeframe };
    case "SET_CHART_TYPE":
      return { ...state, chartType: action.chartType };
    case "SET_CHART_DATA":
      return { ...state, chartData: action.data };
    case "ADD_INDICATOR":
      return {
        ...state,
        indicators: [...state.indicators.filter(i => i.id !== action.indicator.id), action.indicator],
      };
    case "UPDATE_INDICATOR":
      return {
        ...state,
        indicators: state.indicators.map((ind) =>
          ind.id === action.id ? { ...ind, ...action.updates } : ind
        ),
      };
    case "REMOVE_INDICATOR":
      return {
        ...state,
        indicators: state.indicators.filter((ind) => ind.id !== action.id),
      };
    case "ADD_DRAWING":
      return { ...state, drawings: [...state.drawings, action.drawing] };
    case "UPDATE_DRAWING":
      return {
        ...state,
        drawings: state.drawings.map((d) =>
          d.id === action.id ? { ...d, ...action.updates } : d
        ),
      };
    case "REMOVE_DRAWING":
      return {
        ...state,
        drawings: state.drawings.filter((d) => d.id !== action.id),
        selectedDrawing: state.selectedDrawing === action.id ? null : state.selectedDrawing,
      };
    case "CLEAR_DRAWINGS":
      return { ...state, drawings: [], selectedDrawing: null };
    case "ADD_ALERT":
      return { ...state, alerts: [...state.alerts, action.alert] };
    case "UPDATE_ALERT":
      return {
        ...state,
        alerts: state.alerts.map((a) =>
          a.id === action.id ? { ...a, ...action.updates } : a
        ),
      };
    case "REMOVE_ALERT":
      return { ...state, alerts: state.alerts.filter((a) => a.id !== action.id) };
    case "SET_POSITIONS":
      return { ...state, positions: action.positions };
    case "SET_ORDERS":
      return { ...state, orders: action.orders };
    case "ADD_ORDER":
      return { ...state, orders: [...state.orders, action.order] };
    case "UPDATE_ORDER":
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.id ? { ...o, ...action.updates } : o
        ),
      };
    case "SET_WATCHLIST":
      return { ...state, watchlist: action.watchlist };
    case "SET_CROSSHAIR":
      return { ...state, crosshair: action.crosshair };
    case "SET_PRICE_SCALE":
      return { ...state, priceScale: { ...state.priceScale, ...action.scale } };
    case "SET_LAYOUT":
      return { ...state, layout: action.layout };
    case "SET_THEME":
      return { ...state, theme: action.theme };
    case "TOGGLE_SIDEBAR":
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case "SET_SIDEBAR_WIDTH":
      return { ...state, sidebarWidth: action.width };
    case "TOGGLE_NAV":
      return { ...state, navCollapsed: !state.navCollapsed };
    case "SET_DRAWING_TOOL":
      return { ...state, selectedDrawingTool: action.tool };
    case "SET_SELECTED_DRAWING":
      return { ...state, selectedDrawing: action.id };
    case "SET_HOVERED_CANDLE":
      return { ...state, hoveredCandleIndex: action.index };
    case "TOGGLE_INDICATOR_PANE":
      return {
        ...state,
        visibleIndicatorPanes: state.visibleIndicatorPanes.includes(action.pane)
          ? state.visibleIndicatorPanes.filter((p) => p !== action.pane)
          : [...state.visibleIndicatorPanes, action.pane],
      };
    case "SET_WS_CONNECTED":
      return { ...state, wsConnected: action.connected };
    case "LOAD_WORKSPACE":
      return {
        ...state,
        symbol: action.workspace.symbol,
        timeframe: action.workspace.timeframe as Timeframe,
        chartType: action.workspace.chartType,
        indicators: action.workspace.indicators,
        drawings: action.workspace.drawings,
        layout: action.workspace.layout,
        priceScale: { ...state.priceScale, mode: action.workspace.scaleMode },
        theme: action.workspace.theme,
      };
    default:
      return state;
  }
}

interface TerminalContextValue {
  state: TerminalState;
  dispatch: React.Dispatch<TerminalAction>;
  setSymbol: (symbol: string, exchange?: string) => void;
  setTimeframe: (timeframe: Timeframe) => void;
  setChartType: (type: ChartType) => void;
  setChartData: (data: ChartPoint[]) => void;
  addIndicator: (indicator: IndicatorConfig) => void;
  updateIndicator: (id: string, updates: Partial<IndicatorConfig>) => void;
  removeIndicator: (id: string) => void;
  addDrawing: (drawing: DrawingObject) => void;
  updateDrawing: (id: string, updates: Partial<DrawingObject>) => void;
  removeDrawing: (id: string) => void;
  clearDrawings: () => void;
  setCrosshair: (crosshair: CrosshairState | null) => void;
  toggleSidebar: () => void;
  toggleNav: () => void;
  setDrawingTool: (tool: string | null) => void;
  selectDrawing: (id: string | null) => void;
  toggleTheme: () => void;
  saveWorkspace: (name: string) => Workspace;
  loadWorkspace: (workspace: Workspace) => void;
}

const TerminalContext = createContext<TerminalContextValue | null>(null);

const WORKSPACE_KEY = "stockxpert_workspace";

export function TerminalProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(terminalReducer, initialState);

  useEffect(() => {
    const saved = localStorage.getItem(WORKSPACE_KEY);
    if (saved) {
      try {
        const workspace = JSON.parse(saved);
        dispatch({ type: "LOAD_WORKSPACE", workspace });
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(WORKSPACE_KEY);
    try {
      const workspace = JSON.parse(saved ?? "{}");
      if (JSON.stringify(workspace.state) !== JSON.stringify(state)) {
        localStorage.setItem(
          WORKSPACE_KEY,
          JSON.stringify({ state, savedAt: Date.now() })
        );
      }
    } catch {
      // ignore
    }
  }, [state]);

  const setSymbol = useCallback(
    (symbol: string, exchange?: string) => {
      dispatch({ type: "SET_SYMBOL", symbol, exchange });
    },
    []
  );

  const setTimeframe = useCallback((timeframe: Timeframe) => {
    dispatch({ type: "SET_TIMEFRAME", timeframe });
  }, []);

  const setChartType = useCallback((chartType: ChartType) => {
    dispatch({ type: "SET_CHART_TYPE", chartType });
  }, []);

  const setChartData = useCallback((data: ChartPoint[]) => {
    dispatch({ type: "SET_CHART_DATA", data });
  }, []);

  const addIndicator = useCallback((indicator: IndicatorConfig) => {
    dispatch({ type: "ADD_INDICATOR", indicator });
  }, []);

  const updateIndicator = useCallback(
    (id: string, updates: Partial<IndicatorConfig>) => {
      dispatch({ type: "UPDATE_INDICATOR", id, updates });
    },
    []
  );

  const removeIndicator = useCallback((id: string) => {
    dispatch({ type: "REMOVE_INDICATOR", id });
  }, []);

  const addDrawing = useCallback((drawing: DrawingObject) => {
    dispatch({ type: "ADD_DRAWING", drawing });
  }, []);

  const updateDrawing = useCallback(
    (id: string, updates: Partial<DrawingObject>) => {
      dispatch({ type: "UPDATE_DRAWING", id, updates });
    },
    []
  );

  const removeDrawing = useCallback((id: string) => {
    dispatch({ type: "REMOVE_DRAWING", id });
  }, []);

  const clearDrawings = useCallback(() => {
    dispatch({ type: "CLEAR_DRAWINGS" });
  }, []);

  const setCrosshair = useCallback((crosshair: CrosshairState | null) => {
    dispatch({ type: "SET_CROSSHAIR", crosshair });
  }, []);

  const toggleSidebar = useCallback(() => {
    dispatch({ type: "TOGGLE_SIDEBAR" });
  }, []);

  const toggleNav = useCallback(() => {
    dispatch({ type: "TOGGLE_NAV" });
  }, []);

  const setDrawingTool = useCallback((tool: string | null) => {
    dispatch({ type: "SET_DRAWING_TOOL", tool });
  }, []);

  const selectDrawing = useCallback((id: string | null) => {
    dispatch({ type: "SET_SELECTED_DRAWING", id });
  }, []);

  const toggleTheme = useCallback(() => {
    dispatch({ type: "SET_THEME", theme: state.theme === "dark" ? "light" : "dark" });
  }, [state.theme]);

  const saveWorkspace = useCallback(
    (name: string): Workspace => {
      const workspace: Workspace = {
        id: `ws_${Date.now()}`,
        name,
        symbol: state.symbol,
        timeframe: state.timeframe,
        chartType: state.chartType,
        indicators: state.indicators,
        drawings: state.drawings,
        layout: state.layout,
        scaleMode: state.priceScale.mode,
        theme: state.theme,
        savedAt: Date.now(),
      };

      const savedWorkspaces = JSON.parse(
        localStorage.getItem("stockxpert_workspaces") ?? "[]"
      );
      const existing = savedWorkspaces.findIndex((w: Workspace) => w.name === name);
      if (existing >= 0) {
        savedWorkspaces[existing] = workspace;
      } else {
        savedWorkspaces.push(workspace);
      }
      localStorage.setItem(
        "stockxpert_workspaces",
        JSON.stringify(savedWorkspaces)
      );

      return workspace;
    },
    [state]
  );

  const loadWorkspace = useCallback((workspace: Workspace) => {
    dispatch({ type: "LOAD_WORKSPACE", workspace });
  }, []);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      setSymbol,
      setTimeframe,
      setChartType,
      setChartData,
      addIndicator,
      updateIndicator,
      removeIndicator,
      addDrawing,
      updateDrawing,
      removeDrawing,
      clearDrawings,
      setCrosshair,
      toggleSidebar,
      toggleNav,
      setDrawingTool,
      selectDrawing,
      toggleTheme,
      saveWorkspace,
      loadWorkspace,
    }),
    [
      state,
      setSymbol,
      setTimeframe,
      setChartType,
      setChartData,
      addIndicator,
      updateIndicator,
      removeIndicator,
      addDrawing,
      updateDrawing,
      removeDrawing,
      clearDrawings,
      setCrosshair,
      toggleSidebar,
      toggleNav,
      setDrawingTool,
      selectDrawing,
      toggleTheme,
      saveWorkspace,
      loadWorkspace,
    ]
  );

  return (
    <TerminalContext.Provider value={value}>
      {children}
    </TerminalContext.Provider>
  );
}

export function useTerminal() {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error("useTerminal must be used within TerminalProvider");
  }
  return context;
}
