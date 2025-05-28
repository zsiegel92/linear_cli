import { defineConfig } from "tsup";
export default defineConfig({
  entry: ["src/linear_cli.ts"],
  format: ["cjs"],
  dts: false,
  splitting: false,
  clean: true,
  sourcemap: false,
  banner: { js: "#!/usr/bin/env node" },
});
