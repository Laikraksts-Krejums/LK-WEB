import type { Metadata, Viewport } from "next";

// Imports nothing from `sanity` on purpose — see ./[[...tool]]/page.tsx.
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
  return children;
}
