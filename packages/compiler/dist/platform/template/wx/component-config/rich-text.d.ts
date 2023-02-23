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
        tt: any;
        jd: any;
    } | {
        test: RegExp;
        jd: any;
        ali?: undefined;
        swan?: undefined;
        tt?: undefined;
    })[];
};
