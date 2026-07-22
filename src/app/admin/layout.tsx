import type { Metadata, Viewport } from "next";
import "./admin.css";

// A separate root layout (no app/layout.tsx): site ↔ /admin is a full page load,
// which keeps globals.css and Tailwind's Preflight out of the Studio.
export const metadata: Metadata = {
  title: "krējums - redakcija",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="lv">
      <body>{children}</body>
    </html>
  );
}
