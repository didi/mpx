export default function (styles: Array<{
    content: string;
    tag: string;
    attrs: Record<string, any>;
}>, options: {
    autoScope?: boolean;
    moduleId?: string;
    ctorType: string;
}, callback: (err?: Error | null, result?: Record<string, string>) => void): void;
