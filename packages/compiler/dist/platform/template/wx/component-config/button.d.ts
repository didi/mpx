export default function ({ print }: {
    print: any;
}): {
    test: string;
    web(tag: any, { el }: {
        el: any;
    }): string;
    props: ({
        test: string;
        ali({ name, value }: {
            name: any;
            value: any;
        }): {
            name: string;
            value: string;
        }[] | undefined;
        swan({ name, value }: {
            name: any;
            value: any;
        }): void;
        qq({ name, value }: {
            name: any;
            value: any;
        }): void;
        tt({ name, value }: {
            name: any;
            value: any;
        }): void;
        jd?: undefined;
        web?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        ali: any;
        swan?: undefined;
        qq?: undefined;
        tt?: undefined;
        jd?: undefined;
        web?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        swan: any;
        ali?: undefined;
        qq?: undefined;
        tt?: undefined;
        jd?: undefined;
        web?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        qq: any;
        ali?: undefined;
        swan?: undefined;
        tt?: undefined;
        jd?: undefined;
        web?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        jd: any;
        ali?: undefined;
        swan?: undefined;
        qq?: undefined;
        tt?: undefined;
        web?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        tt: any;
        ali?: undefined;
        swan?: undefined;
        qq?: undefined;
        jd?: undefined;
        web?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        web: any;
        ali?: undefined;
        swan?: undefined;
        qq?: undefined;
        tt?: undefined;
        jd?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        qa: any;
        ali?: undefined;
        swan?: undefined;
        qq?: undefined;
        tt?: undefined;
        jd?: undefined;
        web?: undefined;
    })[];
    event: ({
        test: RegExp;
        ali: any;
        swan?: undefined;
        qq?: undefined;
        jd?: undefined;
        tt?: undefined;
        web?: undefined;
    } | {
        test: RegExp;
        swan: any;
        ali?: undefined;
        qq?: undefined;
        jd?: undefined;
        tt?: undefined;
        web?: undefined;
    } | {
        test: RegExp;
        qq: any;
        ali?: undefined;
        swan?: undefined;
        jd?: undefined;
        tt?: undefined;
        web?: undefined;
    } | {
        test: RegExp;
        jd: any;
        ali?: undefined;
        swan?: undefined;
        qq?: undefined;
        tt?: undefined;
        web?: undefined;
    } | {
        test: RegExp;
        tt: any;
        ali?: undefined;
        swan?: undefined;
        qq?: undefined;
        jd?: undefined;
        web?: undefined;
    } | {
        test: RegExp;
        web: any;
        ali?: undefined;
        swan?: undefined;
        qq?: undefined;
        jd?: undefined;
        tt?: undefined;
    })[];
};
