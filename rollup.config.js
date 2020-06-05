import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import livereload from "rollup-plugin-livereload";
import serve from "rollup-plugin-serve";
import { terser } from "rollup-plugin-terser";

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
const production = !process.env.ROLLUP_WATCH;

export default {
  input: "src/main.js",
  output: {
    file: "public/bundle.js",
    format: "es",
    sourcemap: true
  },
  context: "window",
  plugins: [
    resolve(),
    commonjs(),
    !production && serve("public"),
    !production && livereload({ watch: "public" }),
    production && terser()
  ]
};
