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
        qq?: undefined;
        swan?: undefined;
        tt?: undefined;
        web?: undefined;
        jd?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        qq: any;
        swan: any;
        ali?: undefined;
        tt?: undefined;
        web?: undefined;
        jd?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        tt: any;
        ali?: undefined;
        qq?: undefined;
        swan?: undefined;
        web?: undefined;
        jd?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        web: any;
        ali?: undefined;
        qq?: undefined;
        swan?: undefined;
        tt?: undefined;
        jd?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        jd: any;
        ali?: undefined;
        qq?: undefined;
        swan?: undefined;
        tt?: undefined;
        web?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        qa: any;
        ali?: undefined;
        qq?: undefined;
        swan?: undefined;
        tt?: undefined;
        web?: undefined;
        jd?: undefined;
    })[];
    event: ({
        test: RegExp;
        web: any;
        ali?: undefined;
        jd?: undefined;
        qq?: undefined;
        qa?: undefined;
        tt?: undefined;
    } | {
        test: RegExp;
        ali: any;
        jd: any;
        qq: any;
        web?: undefined;
        qa?: undefined;
        tt?: undefined;
    } | {
        test: string;
        web: any;
        ali?: undefined;
        jd?: undefined;
        qq?: undefined;
        qa?: undefined;
        tt?: undefined;
    } | {
        test: string;
        qa: any;
        web?: undefined;
        ali?: undefined;
        jd?: undefined;
        qq?: undefined;
        tt?: undefined;
    } | {
        test: RegExp;
        tt: any;
        web?: undefined;
        ali?: undefined;
        jd?: undefined;
        qq?: undefined;
        qa?: undefined;
    })[];
};
