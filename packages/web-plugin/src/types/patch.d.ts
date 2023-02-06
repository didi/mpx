
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
  import { CompilerResult } from "@mpxjs/compiler";
  export default function parser(...args: any[]): CompilerResult
}
declare module 'webpack/lib/NullFactory' {
  export default class NullFactory {
    constructor()
  }
}
declare module 'webpack/lib/dependencies/HarmonyImportDependencyParserPlugin' {}
declare module 'webpack/lib/FlagEntryExportAsUsedPlugin' {
  export default class FlagEntryExportAsUsedPlugin {
    constructor(nsObjectUsed:boolean, explanation:string)
    apply(compiler: any):this
  }
}
declare module 'webpack/lib/FileSystemInfo' {
  export default function FileSystemInfo(): any
}

declare module '@mpxjs/webpack-plugin/lib/dependencies/ResolveDependency' {
  export default class ResolveDependency{
    static Template: typeof ResolveDependencyTemplate
    constructor(resource:string, packageName:string, issuerResource:string, range: number[])
  }
}
declare class InjectDependencyTemplate {
  constructor();
}
declare module '@mpxjs/webpack-plugin/lib/dependencies/InjectDependency' {
  export default class InjectDependency {
    static Template: typeof InjectDependencyTemplate
    constructor(options : { content: string; index: number } )
  }
}
declare class CommonJsVariableDependencyTemplate {
  constructor();
}
declare module '@mpxjs/webpack-plugin/lib/dependencies/CommonJsVariableDependency' {
  export default class CommonJsVariableDependency {
    name: string
    static Template: typeof CommonJsVariableDependencyTemplate
    constructor(request: string, name: string)
  }
}
declare class ReplaceDependencyTemplate {
  constructor();
}
declare module '@mpxjs/webpack-plugin/lib/dependencies/ReplaceDependency' {
  export default class ReplaceDependency {
    static Template: typeof ReplaceDependencyTemplate
    constructor(replacement: string, range: number[])
  }
}
declare class RecordResourceMapDependencyTemplate {
  constructor();
}
declare module '@mpxjs/webpack-plugin/lib/dependencies/RecordResourceMapDependency' {
  export default class RecordResourceMapDependency {
    static Template: typeof RecordResourceMapDependencyTemplate
    constructor(resourcePath: string, resourceType: string, outputPath: string, packageRoot: string)
  }
}
declare class RecordVueContentDependencyTemplate {
  constructor();
}
declare module '@mpxjs/webpack-plugin/lib/dependencies/RecordVueContentDependency' {
  export default class RecordVueContentDependency {
    static Template: typeof RecordVueContentDependencyTemplate
    constructor(resourcePath: string, content: string)
  }
}

declare module '@mpxjs/webpack-plugin/lib/resolver/AddModePlugin' {
  export default class AddModePlugin {
    constructor(source: string, env: string, fileConditionRules, target)
    apply(...args: any): void
  }
}

declare module '@mpxjs/webpack-plugin/lib/resolver/AddEnvPlugin' {
  export default class AddEnvPlugin {
    constructor(source: string, mode: string, fileConditionRules, target)
    apply(...args: any): void
  }
}

declare interface DepConstructor {
  new (...args: any[]): any;
}

declare class DependencyTemplate {
  constructor();
  apply(...args: any[]): void;
}

declare abstract class ModuleFactory {
  create(...args: any[]): void;
}

declare module 'lru-cache' {
  class LruCache {
    constructor(cache: number);

    get(cacheKey: string): T;

    set(cacheKey: string, content: string): void;
  }
  export default LruCache
}
