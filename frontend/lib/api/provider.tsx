"use client";

import type { PropsWithChildren } from "react";
import { SWRConfig } from "swr";

export function StockxpertDataProvider({ children }: PropsWithChildren) {
  return (
    <SWRConfig
      value={{
        dedupingInterval: 30_000,
        errorRetryCount: 1,
        keepPreviousData: true,
        revalidateOnFocus: false,
        revalidateIfStale: false,
        shouldRetryOnError: false,
        onError: (error) => {
          if ((error as Error).name === "AbortError") return;
          console.error("SWR request failed:", error);
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
