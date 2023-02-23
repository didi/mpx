export default function ({ print }: {
    print: any;
}): {
    test: string;
    web(tag: any, { el }: {
        el: any;
    }): string;
    props: {
        test: RegExp;
        ali: any;
    }[];
    event: {
        test: RegExp;
        ali: any;
    }[];
};
