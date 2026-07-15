import type { Metadata, Viewport } from "next";
import "./admin.css";

// A separate root layout from the site (there is no app/layout.tsx). Because
// Studio lives under its own root, navigating between the site and /admin is a
// full page load — which is exactly what keeps globals.css and Tailwind's
// Preflight from ever loading into the Studio. Imports nothing from `sanity` on
// purpose — see ./[[...tool]]/page.tsx.
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
