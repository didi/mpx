export default function ({ print }: {
    print: any;
}): {
    test: string;
    web(tag: any, { el }: {
        el: any;
    }): string;
    props: ({
        test: RegExp;
        ali: any;
        swan?: undefined;
        tt?: undefined;
        jd?: undefined;
        web?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        swan: any;
        ali?: undefined;
        tt?: undefined;
        jd?: undefined;
        web?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        tt: any;
        ali?: undefined;
        swan?: undefined;
        jd?: undefined;
        web?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        jd: any;
        ali?: undefined;
        swan?: undefined;
        tt?: undefined;
        web?: undefined;
        qa?: undefined;
    } | {
        test: string;
        web(prop: any): {
            name: any;
            value: any;
        };
        ali?: undefined;
        swan?: undefined;
        tt?: undefined;
        jd?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        web: any;
        ali?: undefined;
        swan?: undefined;
        tt?: undefined;
        jd?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        qa: any;
        ali?: undefined;
        swan?: undefined;
        tt?: undefined;
        jd?: undefined;
        web?: undefined;
    })[];
    event: ({
        test: string;
        ali: any;
        swan: any;
        tt: any;
        web: any;
        jd: any;
    } | {
        test: string;
        web: any;
        ali?: undefined;
        swan?: undefined;
        tt?: undefined;
        jd?: undefined;
    })[];
};
