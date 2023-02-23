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
        qq?: undefined;
        tt?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        swan: any;
        ali?: undefined;
        qq?: undefined;
        tt?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        qq: any;
        ali?: undefined;
        swan?: undefined;
        tt?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        tt: any;
        ali?: undefined;
        swan?: undefined;
        qq?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        qa: any;
        ali?: undefined;
        swan?: undefined;
        qq?: undefined;
        tt?: undefined;
    })[];
    event: ({
        test: RegExp;
        ali: any;
        qq?: undefined;
        swan?: undefined;
        tt?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        qq: any;
        ali?: undefined;
        swan?: undefined;
        tt?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        swan: any;
        ali?: undefined;
        qq?: undefined;
        tt?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        tt: any;
        ali?: undefined;
        qq?: undefined;
        swan?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        qa: any;
        ali?: undefined;
        qq?: undefined;
        swan?: undefined;
        tt?: undefined;
    })[];
};
