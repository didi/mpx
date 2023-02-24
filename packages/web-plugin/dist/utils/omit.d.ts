export default function omit<T, K extends keyof T>(obj: T, omitKeys: K[]): Omit<T, K>;
