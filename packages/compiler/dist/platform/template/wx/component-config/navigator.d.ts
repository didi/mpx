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
        qa: any;
        tt?: undefined;
        web?: undefined;
    } | {
        test: string;
        ali(attr: any): void;
        tt(attr: any): void;
        web(attr: any): void;
        qa(attr: any): void;
    } | {
        test: RegExp;
        tt: any;
        ali?: undefined;
        qa?: undefined;
        web?: undefined;
    } | {
        test: RegExp;
        web: any;
        ali?: undefined;
        qa?: undefined;
        tt?: undefined;
    })[];
    event: {
        test: RegExp;
        ali: any;
        tt: any;
        web: any;
        qa: any;
        jd(eventName: any): any;
    }[];
};
