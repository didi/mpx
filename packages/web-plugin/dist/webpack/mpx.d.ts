import { Options } from '../options';
export type Mpx = {
    appInfo?: Record<string, string>;
    pagesMap: any;
    componentsMap: any;
    usingComponents?: Record<string, string>;
    currentPackageRoot?: string;
    wxsContentMap?: any;
    minimize?: boolean;
    staticResourcesMap?: Record<string, any>;
    vueContentCache?: Map<any, any>;
    appTitle?: string;
    recordResourceMap?(record: {
        resourcePath: string;
        resourceType: 'page' | 'component';
        outputPath: string;
        packageRoot: string;
        recordOnly: boolean;
        warn(e: Error): void;
        error(e: Error): void;
    }): void;
};
export type MpxWithOptions = Mpx & Options;
declare const mpx: MpxWithOptions;
export declare function getOptions(): Options;
export default mpx;
