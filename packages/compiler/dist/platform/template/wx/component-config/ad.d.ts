export default function ({ print }: {
    print: any;
}): {
    test: string;
    props: ({
        test: RegExp;
        tt(obj: any): any;
        qq(obj: any): any;
        swan(obj: any): any;
    } | {
        test: RegExp;
        tt: any;
        qq?: undefined;
        swan?: undefined;
    } | {
        test: RegExp;
        qq: any;
        swan: any;
        tt?: undefined;
    })[];
    event: {
        test: RegExp;
        qq: any;
    }[];
};
