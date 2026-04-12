import type { Metadata } from "next";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "WorkshopPro — Vehicle Repair Management",
  description:
    "End-to-end vehicle repair management system for auto workshops. Job cards, invoicing, inventory, and technician tracking — built for Kerala.",
  keywords: ["workshop management", "vehicle repair", "job card", "auto service", "Kerala"],
};

import { WorkshopToastProvider } from "@/components/ui/WorkshopToast";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <WorkshopToastProvider>
            {children}
          </WorkshopToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}