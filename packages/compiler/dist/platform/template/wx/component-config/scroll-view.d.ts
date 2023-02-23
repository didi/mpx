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
        tt: any;
        qq: any;
        swan: any;
        jd?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        swan: any;
        tt: any;
        ali?: undefined;
        qq?: undefined;
        jd?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        jd: any;
        ali?: undefined;
        tt?: undefined;
        qq?: undefined;
        swan?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        qa: any;
        ali?: undefined;
        tt?: undefined;
        qq?: undefined;
        swan?: undefined;
        jd?: undefined;
    })[];
    event: ({
        test: RegExp;
        ali(eventName: any): any;
        jd?: undefined;
        tt?: undefined;
        qq?: undefined;
        swan?: undefined;
    } | {
        test: RegExp;
        jd: any;
        ali?: undefined;
        tt?: undefined;
        qq?: undefined;
        swan?: undefined;
    } | {
        test: RegExp;
        ali: any;
        tt: any;
        qq: any;
        swan: any;
        jd?: undefined;
    })[];
};
