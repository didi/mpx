export default function ({ print }: {
    print: any;
}): {
    test: string;
    ali(): string;
    swan(): string;
    qq(): string;
    jd(): string;
    tt(): string;
    qa(): string;
    dd(): string;
    props: {
        test: string;
        ali(obj: any): any;
        qa(obj: any): any;
    }[];
};
