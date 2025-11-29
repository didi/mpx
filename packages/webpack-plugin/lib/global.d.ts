
declare global {
    interface MpxWebpackPluginOptions {
        style: {
            cssCondition?: {
                before?: boolean;
                after?: boolean;
                beforeExclude?: (string | RegExp)[];
                afterExclude?: (string | RegExp)[];
                legacy?: boolean;
                afterLegacy?: boolean;
                beforeLegacy?: boolean;
            }
        }
    }
}
