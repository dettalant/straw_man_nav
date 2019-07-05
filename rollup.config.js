import typescript from "rollup-plugin-typescript2";
import buble from "rollup-plugin-buble";
import { uglify } from "rollup-plugin-uglify";

const plugins = [
  typescript(),
  buble(),
];

let fileName = "./dist/straw_man_nav";

if (process.env.NODE_ENV === "production") {
  // for production build
  fileName += ".min";
  plugins.push(uglify())
}

export default {
  input: "./src/index.ts",
  output: {
    file: fileName + ".js",
    format: "iife",
    name: "straw_man_nav",
  },
  plugins
};
