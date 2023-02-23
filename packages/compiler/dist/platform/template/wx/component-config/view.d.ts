export default function ({ print }: {
    print: any;
}): {
    test: string;
    web(tag: any, { el }: {
        el: any;
    }): "mpx-view" | "div";
    qa(tag: any): string;
    props: {
        test: RegExp;
        web(prop: any, { el }: {
            el: any;
        }): void;
        qa: any;
    }[];
    event: {
        test: RegExp;
        ali(eventName: any): any;
        qa: any;
    }[];
};
