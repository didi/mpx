/**
 * @param {function(object): function} print
 * @return {array}
 */
export default function ({ print }: {
    print: any;
}): ({
    supportedModes: string[];
    test: RegExp;
    swan: any;
    ali?: undefined;
    qq?: undefined;
    tt?: undefined;
    jd?: undefined;
    qa?: undefined;
} | {
    supportedModes: string[];
    test: RegExp;
    ali: any;
    swan?: undefined;
    qq?: undefined;
    tt?: undefined;
    jd?: undefined;
    qa?: undefined;
} | {
    supportedModes: string[];
    test: RegExp;
    qq: any;
    swan?: undefined;
    ali?: undefined;
    tt?: undefined;
    jd?: undefined;
    qa?: undefined;
} | {
    supportedModes: string[];
    test: RegExp;
    tt: any;
    swan?: undefined;
    ali?: undefined;
    qq?: undefined;
    jd?: undefined;
    qa?: undefined;
} | {
    supportedModes: string[];
    test: RegExp;
    jd: any;
    swan?: undefined;
    ali?: undefined;
    qq?: undefined;
    tt?: undefined;
    qa?: undefined;
} | {
    supportedModes: string[];
    test: RegExp;
    qa: any;
    swan?: undefined;
    ali?: undefined;
    qq?: undefined;
    tt?: undefined;
    jd?: undefined;
})[];
