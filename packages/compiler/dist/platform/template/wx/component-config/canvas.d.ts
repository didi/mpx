export default function ({ print }: {
    print: any;
}): {
    test: string;
    props: ({
        test: RegExp;
        ali({ value }: {
            value: any;
        }): {
            name: string;
            value: any;
        };
        tt?: undefined;
        jd?: undefined;
    } | {
        test: string;
        tt: any;
        ali?: undefined;
        jd?: undefined;
    } | {
        test: string;
        jd: any;
        ali?: undefined;
        tt?: undefined;
    })[];
    event: ({
        test: RegExp;
        ali: any;
        tt?: undefined;
        qa?: undefined;
    } | {
        test: RegExp;
        tt: any;
        qa: any;
        ali?: undefined;
    })[];
};
