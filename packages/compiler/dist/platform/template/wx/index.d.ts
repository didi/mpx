export default function getSpec({ warn, error }: {
    warn: any;
    error: any;
}): {
    supportedModes: string[];
    preProps: never[];
    postProps: {
        web({ name, value }: {
            name: any;
            value: any;
        }): {
            name: string;
            value: string;
        } | undefined;
    }[];
    directive: ({
        test: string;
        swan(obj: any, data: any): {
            name: string;
            value: string;
        };
        web({ value }: {
            value: any;
        }, { el }: {
            el: any;
        }): {
            name: string;
            value: string;
        };
        ali?: undefined;
        qq?: undefined;
        jd?: undefined;
        tt?: undefined;
    } | {
        test: string;
        swan(): boolean;
        web({ value }: {
            value: any;
        }, { el }: {
            el: any;
        }): false | {
            name: string;
            value: any;
        };
        ali?: undefined;
        qq?: undefined;
        jd?: undefined;
        tt?: undefined;
    } | {
        test: RegExp;
        swan(): boolean;
        web(): boolean;
        ali?: undefined;
        qq?: undefined;
        jd?: undefined;
        tt?: undefined;
    } | {
        test: string;
        web({ value }: {
            value: any;
        }, { el }: {
            el: any;
        }): {
            name: string;
            value: any;
        }[] | undefined;
        swan?: undefined;
        ali?: undefined;
        qq?: undefined;
        jd?: undefined;
        tt?: undefined;
    } | {
        test: RegExp;
        web(): boolean;
        swan?: undefined;
        ali?: undefined;
        qq?: undefined;
        jd?: undefined;
        tt?: undefined;
    } | {
        test: string;
        web({ value }: {
            value: any;
        }): {
            name: string;
            value: string;
        };
        swan?: undefined;
        ali?: undefined;
        qq?: undefined;
        jd?: undefined;
        tt?: undefined;
    } | {
        test: RegExp;
        web({ value }: {
            value: any;
        }, { el }: {
            el: any;
        }): false | {
            name: string;
            value: string;
        };
        swan?: undefined;
        ali?: undefined;
        qq?: undefined;
        jd?: undefined;
        tt?: undefined;
    } | {
        test: RegExp;
        ali({ name, value }: {
            name: any;
            value: any;
        }, { eventRules }: {
            eventRules: any;
        }): {
            name: string;
            value: any;
        };
        swan({ name, value }: {
            name: any;
            value: any;
        }, { eventRules }: {
            eventRules: any;
        }): void;
        qq({ name, value }: {
            name: any;
            value: any;
        }, { eventRules }: {
            eventRules: any;
        }): void;
        jd({ name, value }: {
            name: any;
            value: any;
        }, { eventRules }: {
            eventRules: any;
        }): void;
        tt({ name, value }: {
            name: any;
            value: any;
        }, { eventRules }: {
            eventRules: any;
        }): void;
        dd({ name, value }: {
            name: any;
            value: any;
        }, { eventRules }: {
            eventRules: any;
        }): void;
        web({ name, value }: {
            name: any;
            value: any;
        }, { eventRules, el }: {
            eventRules: any;
            el: any;
        }): {
            name: string;
            value: any;
        };
    } | {
        test: RegExp;
        ali(): void;
        swan?: undefined;
        web?: undefined;
        qq?: undefined;
        jd?: undefined;
        tt?: undefined;
    })[];
    event: {
        prefix: {
            ali(prefix: any): any;
            web(prefix: any, data: any, meta: any): string;
        }[];
        rules: {
            test: RegExp;
            ali(eventName: any): any;
            web(eventName: any): void;
        }[];
    };
};
