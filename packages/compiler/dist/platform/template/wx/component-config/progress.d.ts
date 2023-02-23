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
        qq?: undefined;
    } | {
        test: RegExp;
        swan: any;
        ali?: undefined;
        tt?: undefined;
        jd?: undefined;
        qq?: undefined;
    } | {
        test: RegExp;
        ali(obj: any): any;
        tt(obj: any): any;
        swan?: undefined;
        jd?: undefined;
        qq?: undefined;
    } | {
        test: RegExp;
        tt: any;
        ali?: undefined;
        swan?: undefined;
        jd?: undefined;
        qq?: undefined;
    } | {
        test: RegExp;
        jd: any;
        ali?: undefined;
        swan?: undefined;
        tt?: undefined;
        qq?: undefined;
    } | {
        test: RegExp;
        qq: any;
        ali?: undefined;
        swan?: undefined;
        tt?: undefined;
        jd?: undefined;
    })[];
    event: {
        test: RegExp;
        ali: any;
        swan: any;
        tt: any;
        jd: any;
    }[];
};
