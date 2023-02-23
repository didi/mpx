export default function ({ print }: {
    print: any;
}): {
    test: string;
    web(tag: any, { el }: {
        el: any;
    }): "mpx-view" | "div";
    tt(): string;
    props: ({
        test: string;
        ali: any;
        swan({ name, value }: {
            name: any;
            value: any;
        }): void;
        web: any;
    } | {
        test: string;
        web(prop: any, { el }: {
            el: any;
        }): void;
        ali?: undefined;
        swan?: undefined;
    })[];
};
