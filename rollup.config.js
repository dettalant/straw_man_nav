import typescript from "rollup-plugin-typescript2";
import buble from "rollup-plugin-buble";
import { uglify } from "rollup-plugin-uglify";

const scriptArgs = {
  name: process.env.npm_package_name,
  version: process.env.npm_package_version,
  license: process.env.npm_package_license,
  repoUrl: "https://github.com/dettalant/straw_man_nav",
}

const bannerComment = `/*!
 *   ${scriptArgs.name}.js
 * See {@link ${scriptArgs.repoUrl}}
 *
 * @author dettalant
 * @version v${scriptArgs.version}
 * @license ${scriptArgs.license} License
 */`;

const plugins = [
  typescript(),
  buble(),
];


let fileName = "./dist/" + scriptArgs.name;

if (process.env.NODE_ENV === "production") {
  // for production build
  fileName += ".min";

  const uglifyArgs = {
    output: {
      comments: "some"
    }
  };

  plugins.push(uglify(uglifyArgs));
}

const camelize = (str) => {
  const camelStrArray = str.split("_").map((str, idx) => (idx === 0) ? str : str.slice(0, 1).toUpperCase() + str.slice(1));
  return camelStrArray.join("");
}

export default {
  input: "./src/index.ts",
  output: {
    file: fileName + ".js",
    format: "iife",
    name: camelize(scriptArgs.name),
    banner: bannerComment,
  },
  plugins
};
