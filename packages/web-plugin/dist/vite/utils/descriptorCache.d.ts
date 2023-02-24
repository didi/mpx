import { CompilerResult } from '@mpxjs/compiler';
import { Options } from '../../options';
import { JsonTransfromResult } from '../../transfrom/json-compiler';
import { TemplateTransformResult } from '../../transfrom/template-compiler';
import { OptionObject } from 'loader-utils';
export interface SFCDescriptor extends CompilerResult, Omit<TemplateTransformResult, 'templateContent'>, JsonTransfromResult {
    id: string;
    filename: string;
    app: boolean;
    isPage: boolean;
    isComponent: boolean;
    vueSfc?: string;
}
export declare function createDescriptor(filename: string, code: string, query: OptionObject, options: Options): SFCDescriptor;
export declare function getPrevDescriptor(filename: string): SFCDescriptor | undefined;
export declare function setPrevDescriptor(filename: string, entry: SFCDescriptor): void;
export declare function getDescriptor(filename: string, code?: string, query?: OptionObject, options?: Options, createIfNotFound?: boolean): SFCDescriptor | undefined;
export declare function setDescriptor(filename: string, entry: SFCDescriptor): void;
