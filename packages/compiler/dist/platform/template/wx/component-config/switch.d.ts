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
        jd?: undefined;
    } | {
        test: RegExp;
        jd: any;
        ali?: undefined;
    })[];
};
