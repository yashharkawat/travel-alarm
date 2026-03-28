"use client";

import { Suspense } from "react";
import { AnalyticsProvider } from "analytics-kit";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || "";

export default function Analytics({ children }: { children: React.ReactNode }) {
  if (!POSTHOG_KEY) return <>{children}</>;

  return (
    <Suspense fallback={<>{children}</>}>
      <AnalyticsProvider apiKey={POSTHOG_KEY}>{children}</AnalyticsProvider>
    </Suspense>
  );
}
