import type { Metadata } from "next";
import { Fira_Mono } from "next/font/google";
import "@/app/globals.css";

const firaMono = Fira_Mono({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-fira-mono",
  display: "swap",
});

export const metadata: Metadata = {
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
    <html lang="en" className={firaMono.variable} suppressHydrationWarning>
      <body className={`${firaMono.className} antialiased`} suppressHydrationWarning>
        <WorkshopToastProvider>
          {children}
        </WorkshopToastProvider>
      </body>
    </html>
  );
}