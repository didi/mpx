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
        tt({ name, value }: {
            name: any;
            value: any;
        }): boolean;
        qa: any;
        qq?: undefined;
    } | {
        test: string;
        qq({ name, value }: {
            name: any;
            value: any;
        }): void;
        tt: any;
        swan?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        qq: any;
        swan?: undefined;
        tt?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        qa(prop: any): any;
        swan?: undefined;
        tt?: undefined;
        qq?: undefined;
    })[];
    event: ({
        test: RegExp;
        swan: any;
        tt: any;
        qa: any;
        qq?: undefined;
    } | {
        test: RegExp;
        qq: any;
        swan?: undefined;
        tt?: undefined;
        qa?: undefined;
    })[];
};
