import { MonoTypeOperatorFunction, Observable, OperatorFunction, SchedulerLike } from "rxjs";
export declare const IDENTITY: (t: any) => any;
export declare const PASSTHRU: (t: any) => Observable<any>;
export declare type Millisec = number;
export declare function lastOrEmpty<T>(): (source: Observable<T>) => Observable<T>;
export declare function filterFirst<T>(): MonoTypeOperatorFunction<T>;
export declare function takeDuring<T, C>(control$: Observable<C>): MonoTypeOperatorFunction<T>;
export declare function filterTruthy<T>(): (s: Observable<T | null | undefined>) => Observable<T>;
export declare function filterObservable<T>(predicate: (input: Observable<T>) => Observable<boolean>): (source: Observable<Observable<T>>) => Observable<Observable<T>>;
export declare function detour<T, R>(selector: (t: T) => boolean, observableTrue?: ((t: T) => Observable<R>), observableFalse?: ((t: T) => Observable<R>)): OperatorFunction<T, R>;
export declare function interject<T>(f: (t: T) => Observable<any>): OperatorFunction<T, T>;
export declare function extend<T>(t: Millisec, scheduler?: SchedulerLike): MonoTypeOperatorFunction<T>;
export declare function scan2<T, R, SEED>(seed: SEED, f: (acc: R | SEED, t: T, index: number) => R): OperatorFunction<T, R>;
export declare function filtering<T, R>(f: (t: T) => R | undefined | null): OperatorFunction<T, R>;
export declare function finding<T>(f: (t: T) => boolean): OperatorFunction<T[], T>;
export declare function enqueue<T>(durationF: (t: T) => Millisec, scheduler?: SchedulerLike): MonoTypeOperatorFunction<T>;
export declare function prolong<T>(t: Millisec, scheduler?: SchedulerLike): (source: Observable<T>) => Observable<Array<T>>;
export declare function doOnSubscribe<T>(onSubscribe: () => void): (source: Observable<T>) => Observable<T>;
export declare function cachedMapper<TFrom, K, TTo>(keyF: (t: TFrom) => K, mapF: (t: TFrom) => TTo): ((t: TFrom) => TTo);
export declare function zipEmptiable<T>(...observables: Array<Observable<T>>): Observable<T[]>;
export interface Comparable<X> {
    compare(other: X): number;
}
export declare function pairFirst<T>(): (source: Observable<T>) => Observable<[T, T]>;
export declare function promiseToObservable<T>(f: () => Promise<T>): Observable<T>;
export declare function finding$<T>(a$: Observable<T[]>, f: (t: T) => boolean): Observable<T>;
