// Server-side layout for /workshops — injects SEO metadata for this route group
// The actual page component (page.tsx) is "use client" so metadata lives here.
export { metadata } from "./metadata";

export default function WorkshopsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
