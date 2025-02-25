import { defineConfig } from "rollup";
import path from "node:path";
import typescript from "rollup-plugin-typescript2";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { uglify } from "rollup-plugin-uglify";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  input: path.resolve(__dirname, "./src/index.ts"),
  plugins: [
    typescript({
      tsconfigOverride: {
        compilerOptions: {
          module: "ESNext",
        },
      },
      useTsconfigDeclarationDir: true,
    }),
    resolve(),
    commonjs(),
    json(),
    uglify(),
  ],
  output: {
    dir: "./dist",
    entryFileNames: `[name].min.js`,
    exports: "named",
    format: "es",
  },
  treeshake: true,
});
