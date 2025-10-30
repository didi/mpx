const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  outputDir: `dist/${process.env.MPX_CURRENT_TARGET_MODE}`,
  pluginOptions: {
    mpx: {
      plugin: {
        srcMode: "wx",
        hackResolveBuildDependencies: ({ files, resolveDependencies }) => {
          const path = require("path");
          const packageJSONPath = path.resolve("package.json");
          if (files.has(packageJSONPath)) files.delete(packageJSONPath);
          if (resolveDependencies.files.has(packageJSONPath)) {
            resolveDependencies.files.delete(packageJSONPath);
          }
        },
        rnConfig: {
          projectName: "ReactNativeProject",
        },
        // 定义一些全局环境变量，可在JS/模板/样式/JSON中使用
        defs: {
          __testDef__: "default def test",
        },
        decodeHTMLText: true,
        i18n: {
          locale: "en-US",
          // messages既可以通过对象字面量传入，也可以通过messagesPath指定一个js模块路径，在该模块中定义配置并导出，dateTimeFormats/dateTimeFormatsPath和numberFormats/numberFormatsPath同理
          messages: {
            "en-US": {
              message: {
                hello: "{msg} world",
              },
            },
            "zh-CN": {
              message: {
                hello: "{msg} 世界",
              },
            },
          },
        },
      },
      loader: {},
    },
    SSR: {
      devClientPort: 8000,
    },
  },
  /**
   * 如果希望node_modules下的文件时对应的缓存可以失效，
   * 可以将configureWebpack.snap.managedPaths修改为 []
   */
  configureWebpack(config) {
    // 在遇到第一个错误时立即停止编译
    config.bail = true
  },
});
