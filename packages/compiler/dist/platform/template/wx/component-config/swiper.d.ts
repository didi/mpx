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
        jd?: undefined;
        qq?: undefined;
        tt?: undefined;
        web?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        swan: any;
        ali?: undefined;
        jd?: undefined;
        qq?: undefined;
        tt?: undefined;
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
        qq: any;
        ali?: undefined;
        swan?: undefined;
        jd?: undefined;
        tt?: undefined;
        web?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        tt: any;
        ali?: undefined;
        swan?: undefined;
        jd?: undefined;
        qq?: undefined;
        web?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        web: any;
        ali?: undefined;
        swan?: undefined;
        jd?: undefined;
        qq?: undefined;
        tt?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        qa: any;
        ali?: undefined;
        swan?: undefined;
        jd?: undefined;
        qq?: undefined;
        tt?: undefined;
        web?: undefined;
    })[];
    event: ({
        test: RegExp;
        ali(eventName: any): any;
        swan?: undefined;
        jd?: undefined;
    } | {
        test: RegExp;
        swan: any;
        jd: any;
        ali?: undefined;
    })[];
};
