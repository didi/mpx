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
        qa?: undefined;
        tt?: undefined;
        swan?: undefined;
        qq?: undefined;
    } | {
        test: RegExp;
        qa: any;
        ali: any;
        tt: any;
        swan: any;
        qq: any;
    })[];
};
