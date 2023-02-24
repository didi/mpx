import { OptionObject } from 'loader-utils';
export interface Result {
    resource: string;
    loaderString: string;
    resourcePath: string;
    resourceQuery: string;
    rawResourcePath: string;
    queryObj: OptionObject;
}
export declare function parseRequest(request: string): Result;
