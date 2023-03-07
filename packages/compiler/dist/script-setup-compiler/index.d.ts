declare function compileScriptSetup(scriptSetup: any, ctorType: any, filePath: any): {
    content: string;
    map: import("magic-string").SourceMap;
};
export default compileScriptSetup;
