import path from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"
import getCurrentTheme from "./src/tools/getCurrentTheme.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const STYLE_PATH = getCurrentTheme()["stylePath"]

export default {
  configureWebpack: (config) => {
    ;(config.devtool = false),
      (config.optimization = {
        splitChunks: false,
      })
  },
  outputDir: path.resolve(__dirname, "./dist"),
  publicPath: "/",
  pages: {
    index: {
      entry: "src/main.js",
      template: "public/index.html",
      filename: "index.html",
      title: "index",
    },
  },
  pluginOptions: {
    "style-resources-loader": {
      preProcessor: "scss",
      //patterns: [path.resolve(__dirname, "./public/sass/styles.scss")],
    },
  },
  css: {
    loaderOptions: {
      scss: {
        additionalData: `@import "${STYLE_PATH}";`,
      },
    },
  },
}
