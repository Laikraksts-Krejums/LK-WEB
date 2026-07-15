"use client";

import { visionTool } from "@sanity/vision";
import { buildLegacyTheme, defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { apiVersion, dataset, projectId } from "@/sanity/env";
import { schemaTypes } from "@/sanity/schemaTypes";
import { StudioIcon } from "@/sanity/components/StudioIcon";
import { structure } from "@/sanity/structure";

// Matches the cream/ink/orange palette in src/app/globals.css.
const theme = buildLegacyTheme({
  "--black": "#30302e",
  "--white": "#fbf7f0",
  "--brand-primary": "#f05322",
  "--component-bg": "#fbf7f0",
  "--component-text-color": "#30302e",
  "--gray": "#5a5a58",
  "--gray-base": "#5a5a58",
  "--default-button-color": "#5a5a58",
});

export default defineConfig({
  basePath: "/admin",
  projectId,
  dataset,
  title: "krējums",
  icon: StudioIcon,
  theme,
  schema: { types: schemaTypes },
  plugins: [structureTool({ structure }), visionTool({ defaultApiVersion: apiVersion })],
});
