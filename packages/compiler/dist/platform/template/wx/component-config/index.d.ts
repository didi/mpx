export default function getComponentConfigs({ warn, error }: {
    warn: any;
    error: any;
}): ({
    test: string;
    props: ({
        test: RegExp;
        tt(obj: any): any;
        qq(obj: any): any;
        swan(obj: any): any;
    } | {
        test: RegExp;
        tt: any;
        qq?: undefined;
        swan?: undefined;
    } | {
        test: RegExp;
        qq: any;
        swan: any;
        tt?: undefined;
    })[];
    event: {
        test: RegExp;
        qq: any;
    }[];
} | {
    test: string;
    props: ({
        test: string;
        swan({ name, value }: {
            name: any;
            value: any;
        }): boolean;
        tt({ name, value }: {
            name: any;
            value: any;
        }): boolean;
        qa: any;
        qq?: undefined;
    } | {
        test: string;
        qq({ name, value }: {
            name: any;
            value: any;
        }): void;
        tt: any;
        swan?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        qq: any;
        swan?: undefined;
        tt?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        qa(prop: any): any;
        swan?: undefined;
        tt?: undefined;
        qq?: undefined;
    })[];
    event: ({
        test: RegExp;
        swan: any;
        tt: any;
        qa: any;
        qq?: undefined;
    } | {
        test: RegExp;
        qq: any;
        swan?: undefined;
        tt?: undefined;
        qa?: undefined;
    })[];
} | {
    test: string;
    props: ({
        test: RegExp;
        ali({ value }: {
            value: any;
        }): {
            name: string;
            value: any;
        };
        tt?: undefined;
        jd?: undefined;
    } | {
        test: string;
        tt: any;
        ali?: undefined;
        jd?: undefined;
    } | {
        test: string;
        jd: any;
        ali?: undefined;
        tt?: undefined;
    })[];
    event: ({
        test: RegExp;
        ali: any;
        tt?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        tt: any;
        qa: any;
        ali?: undefined;
    })[];
} | {
    test: string;
    web(tag: any, { el }: {
        el: any;
    }): string;
} | {
    test: RegExp;
    ali: (name: any) => string;
    swan: (name: any) => string;
} | {
    test: string;
    props: ({
        test: string;
        swan({ name, value }: {
            name: any;
            value: any;
        }): boolean;
        qq?: undefined;
        tt?: undefined;
    } | {
        test: RegExp;
        swan: any;
        qq?: undefined;
        tt?: undefined;
    } | {
        test: RegExp;
        qq: any;
        swan?: undefined;
        tt?: undefined;
    } | {
        test: RegExp;
        tt: any;
        swan?: undefined;
        qq?: undefined;
    })[];
    event: ({
        test: RegExp;
        qq: any;
        swan: any;
        tt?: undefined;
    } | {
        test: RegExp;
        tt: any;
        qq?: undefined;
        swan?: undefined;
    })[];
} | {
    test: string;
    props: {
        test: RegExp;
        qq: any;
    }[];
    event: {
        test: RegExp;
        qq: any;
    }[];
} | {
    test: string;
    props: ({
        test: RegExp;
        ali: any;
        swan?: undefined;
        jd?: undefined;
        tt?: undefined;
        qa?: undefined;
    } | {
        test: string;
        swan: any;
        ali?: undefined;
        jd?: undefined;
        tt?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        jd: any;
        ali?: undefined;
        swan?: undefined;
        tt?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        tt: any;
        ali?: undefined;
        swan?: undefined;
        jd?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        qa: any;
        ali?: undefined;
        swan?: undefined;
        jd?: undefined;
        tt?: undefined;
    })[];
    event: ({
        test: RegExp;
        ali: any;
        swan?: undefined;
        jd?: undefined;
        tt?: undefined;
        qa?: undefined;
    } | {
        test: string;
        swan: any;
        ali?: undefined;
        jd?: undefined;
        tt?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        jd: any;
        ali?: undefined;
        swan?: undefined;
        tt?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        tt: any;
        ali?: undefined;
        swan?: undefined;
        jd?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        qa: any;
        ali?: undefined;
        swan?: undefined;
        jd?: undefined;
        tt?: undefined;
    })[];
} | {
    test: string;
    props: {
        test: string;
        swan({ name, value }: {
            name: any;
            value: any;
        }): {
            name: any;
            value: string;
        };
    }[];
} | {
    supportedModes: string[];
    test: RegExp;
    swan: any;
    ali?: undefined;
    qq?: undefined;
    tt?: undefined;
    jd?: undefined;
    qa?: undefined;
} | {
    supportedModes: string[];
    test: RegExp;
    ali: any;
    swan?: undefined;
    qq?: undefined;
    tt?: undefined;
    jd?: undefined;
    qa?: undefined;
} | {
    supportedModes: string[];
    test: RegExp;
    qq: any;
    swan?: undefined;
    ali?: undefined;
    tt?: undefined;
    jd?: undefined;
    qa?: undefined;
} | {
    supportedModes: string[];
    test: RegExp;
    tt: any;
    swan?: undefined;
    ali?: undefined;
    qq?: undefined;
    jd?: undefined;
    qa?: undefined;
} | {
    supportedModes: string[];
    test: RegExp;
    jd: any;
    swan?: undefined;
    ali?: undefined;
    qq?: undefined;
    tt?: undefined;
    qa?: undefined;
} | {
    supportedModes: string[];
    test: RegExp;
    qa: any;
    swan?: undefined;
    ali?: undefined;
    qq?: undefined;
    tt?: undefined;
    jd?: undefined;
} | {
    test: string;
    ali(): string;
    swan(): string;
    qq(): string;
    jd(): string;
    tt(): string;
    qa(): string;
    dd(): string;
    props: {
        test: string;
        ali(obj: any): any;
        qa(obj: any): any;
    }[];
} | {
    test: string;
    props: {
        test: string;
        ali(obj: any, data: any): {
            name: string;
            value: string;
        };
        swan(obj: any, data: any): {
            name: string;
            value: string;
        };
    }[];
})[];
