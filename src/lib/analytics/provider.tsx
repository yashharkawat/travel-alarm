"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";

interface AnalyticsProviderProps {
  apiKey: string;
  apiHost?: string;
  children: React.ReactNode;
}

let initialized = false;

export function AnalyticsProvider({
  apiKey,
  apiHost = "https://us.i.posthog.com",
  children,
}: AnalyticsProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (initialized || !apiKey || typeof window === "undefined") return;

    posthog.init(apiKey, {
      api_host: apiHost,
      capture_pageview: false,
      capture_pageleave: true,
      persistence: "localStorage",
      autocapture: true,
    });

    initialized = true;
  }, [apiKey, apiHost]);

  useEffect(() => {
    if (!initialized) return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return <>{children}</>;
}
