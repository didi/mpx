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
    } | {
        test: RegExp;
        swan(obj: any): any;
        ali?: undefined;
        tt?: undefined;
    } | {
        test: RegExp;
        tt(obj: any): any;
        ali?: undefined;
        swan?: undefined;
    })[];
};
