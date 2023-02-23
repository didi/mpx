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
        jd: any;
        qq: any;
        web?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        web: any;
        qa: any;
        ali?: undefined;
        swan?: undefined;
        jd?: undefined;
        qq?: undefined;
    })[];
};
