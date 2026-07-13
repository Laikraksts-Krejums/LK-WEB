import type { SchemaTypeDefinition } from "sanity";
import { hotspot } from "./hotspot";
import { issue } from "./issue";
import { r2Image } from "./r2Image";
import { siteSettings } from "./siteSettings";

export const schemaTypes: SchemaTypeDefinition[] = [
  issue,
  siteSettings,
  r2Image,
  hotspot,
];
