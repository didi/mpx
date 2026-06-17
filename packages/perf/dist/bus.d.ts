import type { Reporter } from './types';
export declare const bus: {
    setReporter(r: Reporter | undefined): void;
    start(): void;
    end(reporter?: Reporter): void;
    isRecording(): boolean;
    pushMeasure(name: string, dur: number): void;
};
