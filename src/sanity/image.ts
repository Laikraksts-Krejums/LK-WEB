import {
  createImageUrlBuilder,
  type SanityImageSource,
} from "@sanity/image-url";
import { dataset, projectId } from "./env";

const builder = createImageUrlBuilder({ projectId, dataset });

/** Covers stay in Sanity; its CDN does the resizing. */
export function urlForImage(source: SanityImageSource, width: number): string {
  return builder.image(source).width(width).auto("format").quality(80).url();
}
