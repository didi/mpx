/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'webpack/lib/InitFragment' {
  export default class InitFragment {
    static STAGE_CONSTANTS: any
    constructor(...args: any[])
  }
}
declare module 'webpack/lib/util/makeSerializable' {
  export default function makeSerializable(...args: any[]): any
}
declare module 'webpack/lib/dependencies/ModuleDependency' {}
declare module '@mpxjs/compiler/template-compiler/parser' {
  export default function parser(...args: any[]): any
}