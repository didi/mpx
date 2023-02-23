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
        swan: any;
        qq: any;
        tt: any;
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
        web(prop: any, { el }: {
            el: any;
        }): void;
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
};
