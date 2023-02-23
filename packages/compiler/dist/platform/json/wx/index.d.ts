import normalizeTest from '../normalize-test';
export default function getSpec({ warn, error }: {
    warn: any;
    error: any;
}): {
    supportedModes: string[];
    normalizeTest: typeof normalizeTest;
    page: ({
        test: string;
        ali(input: any): any;
        jd: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        qq?: undefined;
        swan?: undefined;
        tt?: undefined;
    } | {
        test: string;
        ali: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        qq: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        jd: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        swan: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        tt?: undefined;
    } | {
        test: string;
        qq: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        jd: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        ali?: undefined;
        swan?: undefined;
        tt?: undefined;
    } | {
        test: string;
        ali: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        qq: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        jd: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        swan?: undefined;
        tt?: undefined;
    } | {
        test: string;
        ali: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        swan: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        jd?: undefined;
        qq?: undefined;
        tt?: undefined;
    } | {
        test: string;
        ali: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        jd?: undefined;
        qq?: undefined;
        swan?: undefined;
        tt?: undefined;
    } | {
        test: string;
        ali: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        swan: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        tt: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        jd: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        qq?: undefined;
    } | {
        ali: (input: any, { globalComponents }: {
            globalComponents: any;
        }) => any;
        swan: (input: any, { globalComponents }: {
            globalComponents: any;
        }) => any;
        qq: (input: any, { globalComponents }: {
            globalComponents: any;
        }) => any;
        tt: (input: any, { globalComponents }: {
            globalComponents: any;
        }) => any;
        jd: (input: any, { globalComponents }: {
            globalComponents: any;
        }) => any;
        test?: undefined;
    })[];
    component: ({
        test: string;
        ali: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        swan?: undefined;
        qq?: undefined;
        tt?: undefined;
    } | {
        ali: (input: any, { globalComponents }: {
            globalComponents: any;
        }) => any;
        swan: (input: any, { globalComponents }: {
            globalComponents: any;
        }) => any;
        qq: (input: any, { globalComponents }: {
            globalComponents: any;
        }) => any;
        tt: (input: any, { globalComponents }: {
            globalComponents: any;
        }) => any;
        test?: undefined;
    })[];
    tabBar: {
        list: {
            test: string;
            ali(input: any): any;
        }[];
        rules: ({
            test: string;
            ali: (input: any, { mode, pathArr }: {
                mode: any;
                pathArr?: never[] | undefined;
            }, meta: any) => any;
            swan: (input: any, { mode, pathArr }: {
                mode: any;
                pathArr?: never[] | undefined;
            }, meta: any) => any;
            tt?: undefined;
            jd?: undefined;
        } | {
            test: string;
            ali: (input: any, { mode, pathArr }: {
                mode: any;
                pathArr?: never[] | undefined;
            }, meta: any) => any;
            swan?: undefined;
            tt?: undefined;
            jd?: undefined;
        } | {
            test: string;
            ali: (input: any, { mode, pathArr }: {
                mode: any;
                pathArr?: never[] | undefined;
            }, meta: any) => any;
            swan: (input: any, { mode, pathArr }: {
                mode: any;
                pathArr?: never[] | undefined;
            }, meta: any) => any;
            tt: (input: any, { mode, pathArr }: {
                mode: any;
                pathArr?: never[] | undefined;
            }, meta: any) => any;
            jd: (input: any, { mode, pathArr }: {
                mode: any;
                pathArr?: never[] | undefined;
            }, meta: any) => any;
        })[];
    };
    rules: ({
        test: string;
        ali: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        qq: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        swan: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        tt: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        jd: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
    } | {
        test: string;
        tt: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        jd: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        ali?: undefined;
        qq?: undefined;
        swan?: undefined;
    } | {
        test: string;
        qq: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        swan: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        tt: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        jd: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        ali?: undefined;
    } | {
        test: string;
        ali: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        swan: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        qq?: undefined;
        tt?: undefined;
        jd?: undefined;
    } | {
        test: string;
        ali: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        tt: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        qq?: undefined;
        swan?: undefined;
        jd?: undefined;
    } | {
        test: string;
        jd: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        ali: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        swan: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        tt: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        qq?: undefined;
    } | {
        test: string;
        jd: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        ali?: undefined;
        qq?: undefined;
        swan?: undefined;
        tt?: undefined;
    } | {
        test: string;
        ali: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        jd: (input: any, { mode, pathArr }: {
            mode: any;
            pathArr?: never[] | undefined;
        }, meta: any) => any;
        qq?: undefined;
        swan?: undefined;
        tt?: undefined;
    })[];
};
