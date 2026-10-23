import {
  createImageUrlBuilder,
  type SanityImageSource,
} from "@sanity/image-url";
import { dataset, projectId } from "./env";

const builder = createImageUrlBuilder({ projectId, dataset });

export function urlForImage(source: SanityImageSource, width: number): string {
  return builder.image(source).width(width).auto("format").quality(80).url();
}

// Cropped on the CDN around the Studio hotspot: rendering in the Worker blows its CPU limit.
export function urlForOgCard(source: SanityImageSource): string {
  return builder
    .image(source)
    .width(1200)
    .height(630)
    .format("jpg")
    .quality(85)
    .url();
}
