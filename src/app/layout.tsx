import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Travel Alarm",
  description: "Set alarms based on distance or time to your destination",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0a]">
        <div className="max-w-md mx-auto px-4 py-6">{children}</div>
      </body>
    </html>
  );
}
