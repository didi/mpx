export default function ({ print }: {
    print: any;
}): {
    test: string;
    web(tag: any, { el }: {
        el: any;
    }): string;
    props: ({
        test: string;
        ali(attr: any): boolean;
        tt?: undefined;
        swan?: undefined;
        jd?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        tt: any;
        swan: any;
        ali: any;
        jd: any;
        qa: any;
    })[];
    event: {
        test: RegExp;
        ali: any;
    }[];
};
