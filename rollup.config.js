import resolve from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import livereload from "rollup-plugin-livereload";
import css from "rollup-plugin-css-only";
import { terser } from "rollup-plugin-terser";

const production = !process.env.ROLLUP_WATCH;

export default [
  {
    input: "server/index.js",
    output: {
      file: "dist/server.js",
      format: "cjs",
      sourcemap: true
    },
    plugins: []
  },
  {
    input: "src/main.js",
    output: {
      file: "public/bundle.js",
      format: "esm",
      sourcemap: true
    },
    context: "window",
    plugins: [
      resolve({ browser: true }),
      css({ output: "public/bundle.css" }),
      commonjs(),
      json(),
      !production && livereload({ watch: "public", delay: 500 }),
      production && babel(),
      production && terser() // requires babel...
    ]
  }
];
