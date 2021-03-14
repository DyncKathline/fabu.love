const path = require("path");
const resolve = dir => path.join(__dirname, dir);
const {
  version,
  author,
  name
} = require("./package.json");
const {
  title,
  publicPath
} = require("./src/config/settings");
const isProduction = process.env.NODE_ENV === "production";
console.log(process.env.VUE_APP_FABU_BASE_URL);
console.log(process.env.VUE_APP_FABU_ALLOW_REGISTER);
process.env.VUE_APP_TITLE = title || name;
process.env.VUE_APP_AUTHOR = author || "vue";
process.env.VUE_APP_VERSION = version;

// All configuration item explanations can be find in https://cli.vuejs.org/config/
module.exports = {
  publicPath: publicPath,
  outputDir: "dist",
  assetsDir: "static",
  lintOnSave: !isProduction,
  productionSourceMap: false,
  devServer: {
    port: 8080,
    open: false,
    overlay: {
      warnings: false,
      errors: true
    }
  },
  configureWebpack: {
    resolve: {
      alias: {
        "@": resolve("src")
      }
    }
  },
  chainWebpack(config) {
    // 修改或新增html-webpack-plugin的值，在index.html里面能读取htmlWebpackPlugin.options.title
    config.plugin('html')
      .tap(args => {
        args[0].title = title;
        return args;
      });
    // it can improve the speed of the first screen, it is recommended to turn on preload
    config.plugin("preload").tap(() => [{
      rel: "preload",
      // to ignore runtime.js
      // https://github.com/vuejs/vue-cli/blob/dev/packages/@vue/cli-service/lib/config/app.js#L171
      fileBlacklist: [/\.map$/, /hot-update\.js$/, /runtime\..*\.js$/],
      include: "initial"
    }]);

    // when there are many pages, it will cause too many meaningless requests
    config.plugins.delete("prefetch");

    // set svg-sprite-loader
    config.module
      .rule("svg")
      .exclude.add(resolve("src/icons"))
      .end();
    config.module
      .rule("icons")
      .test(/\.svg$/)
      .include.add(resolve("src/icons"))
      .end()
      .use("svg-sprite-loader")
      .loader("svg-sprite-loader")
      .options({
        symbolId: "icon-[name]"
      })
      .end();

    config.when(process.env.NODE_ENV !== "development", config => {
      config
        .plugin("ScriptExtHtmlWebpackPlugin")
        .after("html")
        .use("script-ext-html-webpack-plugin", [{
          // `runtime` must same as runtimeChunk name. default is `runtime`
          inline: /runtime\..*\.js$/
        }])
        .end();
      config.optimization.splitChunks({
        chunks: "all",
        cacheGroups: {
          libs: {
            name: "chunk-libs",
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            chunks: "initial" // only package third parties that are initially dependent
          },
          elementUI: {
            name: "chunk-elementUI", // split elementUI into a single package
            priority: 20, // the weight needs to be larger than libs and app or it will be packaged into libs or app
            test: /[\\/]node_modules[\\/]_?element-ui(.*)/ // in order to adapt to cnpm
          },
          commons: {
            name: "chunk-commons",
            test: resolve("src/components"), // can customize your rules
            minChunks: 3, //  minimum common number
            priority: 5,
            reuseExistingChunk: true
          }
        }
      });
      // https:// webpack.js.org/configuration/optimization/#optimizationruntimechunk
      config.optimization.runtimeChunk("single");
    });
  }
};