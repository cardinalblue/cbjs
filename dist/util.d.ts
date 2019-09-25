import { Observable } from "rxjs";
export declare const BLANK = "";
export declare function taplog<X>(label: string, ...vars: any[]): (s: Observable<X>) => Observable<X>;
export declare function LOG<X>(s: string, x: X, ...args: any[]): X;
export declare function LOGTHRU<X>(...vars: any[]): X;
export interface Elementable<T> {
    elements: Array<T>;
}
export declare function subkeys<T>(target: T, ...keys: Array<keyof T>): {};
export declare function withoutFirst<T>(a: Array<T>, t: T): T[];
export declare function arrayRemove<T>(array: T[], f: (t: T) => boolean): T[];
export declare function isEmpty<T>(array: T[]): boolean;
export declare function last<T>(a: T[]): T | null;
export declare function next<T>(array: T[], target: T): T | null;
export declare function mapmap<T, R>(map: {
    [k: string]: T;
}, f: ((t: T) => R)): {
    [k: string]: R;
};
export declare function apply<T>(t: T, f: (t: T) => any): T;
export declare function wiht<T, R>(input: T, f: (t: T) => R): R;
export declare function alos<T>(input: T, f: (t: T) => any): T;
export declare function trim2(s: string): string;
export declare function insertAt(s1: string, index: number, s2: string): string;
export declare type ID = string;
export declare function generateId(): ID;
export declare function rand(i: number): number;
export declare function ifNumber(x: any, or: number): number;
export declare function isFocused(dom: HTMLElement): boolean;
declare type QueueSubscriber<T> = (t: T) => void;
export declare class Queue<T> {
    q: Array<T>;
    subscribers: Array<QueueSubscriber<T>>;
    subscribe(subscriber: QueueSubscriber<T>): () => void;
    push(t: T): void;
    resolve(): void;
}
export declare class Range {
    readonly index: number;
    readonly length: number;
    constructor(index: number, length: number);
}
export {};
