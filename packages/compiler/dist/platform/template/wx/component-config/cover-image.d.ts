export default function ({ print }: {
    print: any;
}): {
    test: string;
    web(tag: any, { el }: {
        el: any;
    }): string;
    tt(): string;
    props: {
        test: string;
        web(prop: any, { el }: {
            el: any;
        }): void;
    }[];
    event: {
        test: RegExp;
        ali: any;
    }[];
};
