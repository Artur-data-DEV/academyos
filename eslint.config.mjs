import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores([
    ".next/**",
    "apps/*/.next/**",
    "apps/*/out/**",
    "apps/*/build/**",
    "content/**",
    "node_modules/**",
    "packages/**/dist/**",
    "next-env.d.ts",
  ]),
]);
