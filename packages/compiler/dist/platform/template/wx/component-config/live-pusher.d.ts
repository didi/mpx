export default function ({ print }: {
    print: any;
}): {
    test: string;
    props: {
        test: RegExp;
        qq: any;
    }[];
    event: {
        test: RegExp;
        qq: any;
    }[];
};
