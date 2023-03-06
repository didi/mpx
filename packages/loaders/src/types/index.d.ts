/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '@mpxjs/compiler/template-compiler/parser' {
  export default function parser(...args: any[]): any
}
declare module '@mpxjs/webpack-plugin/lib/dependencies/RecordResourceMapDependency' {
  export default class RecordResourceMapDependency {
    constructor(resourcePath: string, resourceType: string, outputPath: string, packageRoot: string )
  }
}
