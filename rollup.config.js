import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import livereload from "rollup-plugin-livereload";
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
      commonjs(),
      json(),
      !production && livereload({ watch: "public", delay: 500 }),
      production && terser()
    ]
  }
];
