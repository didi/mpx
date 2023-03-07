import platform from './platform';
import templateCompiler from './template-compiler';
import scriptSetupCompiler from './script-setup-compiler/index';
import styleCompiler from './style-compiler';
import jsonCompiler from './json-compiler';
export * from './template-compiler/index';
export * from './style-compiler/index';
export * from './json-compiler';
export { templateCompiler, styleCompiler, jsonCompiler, platform, scriptSetupCompiler };
