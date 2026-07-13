import {
  createImageUrlBuilder,
  type SanityImageSource,
} from "@sanity/image-url";
import { dataset, projectId } from "./env";

const builder = createImageUrlBuilder({ projectId, dataset });

/** Covers and hero images stay in Sanity; its CDN does the resizing. */
export function urlForImage(source: SanityImageSource, width: number): string {
  return builder.image(source).width(width).auto("format").quality(80).url();
}

/**
 * Sanity encodes the source dimensions in the asset ref
 * (`image-<hash>-1131x1600-jpg`). Reading them here lets the hero reserve its
 * box in the first paint instead of shoving the page down when it decodes.
 */
export function imageAspect(
  source: { asset?: { _ref?: string } } | undefined,
  width: number,
): { width: number; height: number } | undefined {
  const match = /-(\d+)x(\d+)-\w+$/.exec(source?.asset?._ref ?? "");
  if (!match) return undefined;
  const [, w, h] = match;
  return { width, height: Math.round((width * Number(h)) / Number(w)) };
}
