export default function ({ print }: {
    print: any;
}): {
    test: string;
    web(tag: any, { el }: {
        el: any;
    }): "mpx-text" | "span";
    props: ({
        test: RegExp;
        swan: any;
        ali?: undefined;
        tt?: undefined;
        qq?: undefined;
        qa?: undefined;
        web?: undefined;
    } | {
        test: RegExp;
        ali: any;
        tt: any;
        qq: any;
        qa: any;
        swan?: undefined;
        web?: undefined;
    } | {
        test: RegExp;
        web(prop: any, { el }: {
            el: any;
        }): void;
        qa: any;
        swan?: undefined;
        ali?: undefined;
        tt?: undefined;
        qq?: undefined;
    })[];
};
