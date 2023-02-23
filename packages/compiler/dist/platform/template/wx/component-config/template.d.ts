export default function (): {
    test: string;
    props: {
        test: string;
        swan({ name, value }: {
            name: any;
            value: any;
        }): {
            name: any;
            value: string;
        };
    }[];
};
