import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Build output. Gitignored, so CI never sees it, but a local `npm run lint`
    // after a deploy build otherwise reports thousands of findings in bundles.
    ".open-next/**",
    ".wrangler/**",
  ]),
]);

export default eslintConfig;
