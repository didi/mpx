export declare function createHelpers(loaderContext: any): {
    getRequire: (type: string, part: Record<string, any>, extraOptions: Record<string, any>, index?: number) => string;
    getImport: (type: string, part: Record<string, any>, extraOptions: Record<string, any>, index: number) => string;
    getNamedExports: (type: string, part: Record<string, any>, extraOptions: Record<string, any>, index: number) => string;
    getRequestString: (type: string, part: Record<string, any>, extraOptions: Record<string, any>, index?: number) => string;
};
