export default function ({ print }: {
    print: any;
}): {
    test: string;
    props: ({
        test: string;
        swan({ name, value }: {
            name: any;
            value: any;
        }): boolean;
        qq?: undefined;
        tt?: undefined;
    } | {
        test: RegExp;
        swan: any;
        qq?: undefined;
        tt?: undefined;
    } | {
        test: RegExp;
        qq: any;
        swan?: undefined;
        tt?: undefined;
    } | {
        test: RegExp;
        tt: any;
        swan?: undefined;
        qq?: undefined;
    })[];
    event: ({
        test: RegExp;
        qq: any;
        swan: any;
        tt?: undefined;
    } | {
        test: RegExp;
        tt: any;
        qq?: undefined;
        swan?: undefined;
    })[];
};
