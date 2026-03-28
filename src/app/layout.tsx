import type { Metadata, Viewport } from "next";
import Analytics from "@/components/Analytics";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://travel-alarm.yashharkawat.com"),
  title: "Travel Alarm - Distance & Time Based Travel Alerts",
  description:
    "Set smart travel alarms based on distance or time remaining to your destination. Get notified when you're approaching your stop so you never miss it again.",
  keywords: [
    "travel alarm",
    "distance alarm",
    "location alarm",
    "travel alert",
    "destination alarm",
    "proximity alert",
    "commute alarm",
    "GPS alarm",
    "travel notification",
    "never miss your stop",
  ],
  authors: [{ name: "Yash Harkawat" }],
  creator: "Yash Harkawat",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://travel-alarm.yashharkawat.com",
  },
  openGraph: {
    title: "Travel Alarm - Distance & Time Based Travel Alerts",
    description:
      "Set smart travel alarms based on distance or time remaining to your destination. Never miss your stop again.",
    type: "website",
    url: "https://travel-alarm.yashharkawat.com",
    siteName: "Travel Alarm",
  },
  twitter: {
    card: "summary_large_image",
    title: "Travel Alarm - Distance & Time Based Travel Alerts",
    description:
      "Set smart travel alarms based on distance or time remaining to your destination. Never miss your stop again.",
    creator: "@yashharkawat",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Travel Alarm",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0a]">
        <Analytics>
          <div className="max-w-md mx-auto px-4 py-6 pb-20">{children}</div>
        </Analytics>
      </body>
    </html>
  );
}
