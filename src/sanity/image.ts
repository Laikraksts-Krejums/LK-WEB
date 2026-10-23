import {
  createImageUrlBuilder,
  type SanityImageSource,
} from "@sanity/image-url";
import { dataset, projectId } from "./env";

const builder = createImageUrlBuilder({ projectId, dataset });

export function urlForImage(source: SanityImageSource, width: number): string {
  return builder.image(source).width(width).auto("format").quality(80).url();
}

// Letterboxed on the CDN: rendering the card in the Worker blows its CPU limit.
// ignoreImageParams stops the builder auto-cropping the cover to 1200×630.
export function urlForOgCard(source: SanityImageSource): string {
  return builder
    .image(source)
    .ignoreImageParams()
    .width(1200)
    .height(630)
    .fit("fill")
    .bg("f2e8d9")
    .format("jpg")
    .quality(85)
    .url();
}
