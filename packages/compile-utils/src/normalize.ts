export const normalize = {
  lib : (file: string) => '@mpxjs/webpack-plugin/lib/' + file,
  runtime : (file: string) => '@mpxjs/web-plugin/src/runtime/' + file,
  utils: (file: string) => '@mpxjs/compile-utils/' + file
}