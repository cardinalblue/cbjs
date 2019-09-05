import { Observable, Subject } from "rxjs";
import { RefObject } from "react";
declare type InputStreamerInput = string | RefObject<HTMLElement> | HTMLElement;
export declare class InputStreamer {
    readonly stream$: Subject<Observable<string>>;
    onStart(): void;
    onInput(input: InputStreamerInput): void;
    onStop(): void;
    onSpecialKey(input: InputStreamerInput, key: string): boolean;
    private cur$;
    private start$;
}
export {};
