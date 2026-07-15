import type { SchemaTypeDefinition } from "sanity";
import { hotspot } from "./hotspot";
import { issue } from "./issue";
import { r2Image } from "./r2Image";
import { siteLink } from "./siteLink";
import { siteSettings } from "./siteSettings";

export const schemaTypes: SchemaTypeDefinition[] = [
  issue,
  siteSettings,
  siteLink,
  r2Image,
  hotspot,
];
