import parser from './parser';
import { RawSourceMap } from 'source-map';
type Mode = 'wx' | 'web' | 'ali' | 'swan';
export interface SFCBlock {
    tag: 'template' | 'script' | 'style';
    content: string;
    result?: string;
    start?: number;
    attrs: {
        [key: string]: string | true;
    };
    priority?: number;
    end?: number;
    src?: string;
    map?: RawSourceMap;
}
export interface Template extends SFCBlock {
    tag: 'template';
    type: 'template';
    lang?: string;
    mode?: Mode;
}
export interface Script extends SFCBlock {
    tag: 'script';
    type: 'script';
    setup?: boolean;
    mode?: Mode;
}
export interface JSON extends SFCBlock {
    tag: 'script';
    type: 'application/json' | 'json';
    attrs: {
        type: 'application/json' | 'json';
    };
    src: string;
    useJSONJS: boolean;
}
export interface Style extends SFCBlock {
    tag: 'style';
    type: 'style';
    scoped?: boolean;
}
export interface CompilerResult {
    template: Template | null;
    script: Script | null;
    json: JSON | null;
    styles: Style[];
    customBlocks: any[];
}
export interface ParseHtmlNode {
    type: number;
    tag: string;
    children: ParseHtmlNode[];
}
export interface ParseResult {
    meta: {
        builtInComponentsMap?: Record<string, string>;
        wxsModuleMap?: Record<string, string>;
        wxsContentMap?: Record<string, string>;
        genericsInfo?: Record<string, unknown>;
    };
    root: ParseHtmlNode;
}
interface Compiler {
    parseComponent(template: string, options: {
        mode: Mode;
        defs?: Record<string, unknown>;
        env?: string;
        filePath?: string;
        pad?: 'line';
        needMap?: boolean;
    }): CompilerResult;
    parse(template: string, options: {
        warn: (msg: string) => void;
        error: (msg: string) => void;
        defs: Record<string, unknown>;
        mode: Mode;
        srcMode: Mode;
        i18n: Record<string, unknown> | null;
        decodeHTMLText: boolean;
        externalClasses: string[];
        checkUsingComponents: boolean;
        usingComponents: string[];
        componentGenerics: Record<string, {
            default?: string;
        }>;
        hasComment: boolean;
        isNative: boolean;
        isComponent: boolean;
        hasScoped: boolean;
        moduleId: string;
        filePath: string;
        globalComponents: string[];
    }): ParseResult;
    serialize(root: ParseHtmlNode): string;
    addAttrs(root: ParseHtmlNode, options: any[]): void;
    parseMustache(...args: any[]): any;
}
interface TemplateCompiler {
    compiler: Compiler;
    parser: typeof parser;
}
declare const templateCompiler: TemplateCompiler;
export default templateCompiler;
