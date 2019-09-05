import { Observable, OperatorFunction } from "rxjs";
export declare const IDENTITY: (t: any) => any;
export declare const PASSTHRU: (t: any) => Observable<any>;
export declare function lastOrEmpty<T>(): (source: Observable<T>) => Observable<T>;
export declare function filterFirst<T>(): import("rxjs").MonoTypeOperatorFunction<T>;
export declare function detour<T, R>(selector: (t: T) => boolean, observableTrue?: ((t: T) => Observable<R>), observableFalse?: ((t: T) => Observable<R>)): OperatorFunction<T, R>;
export declare function interject<T>(f: (t: T) => Observable<any>): OperatorFunction<T, T>;
export declare function scan2<T, R, SEED>(seed: SEED, f: (acc: R | SEED, t: T, index: number) => R): OperatorFunction<T, R>;
export declare function filtering<T, R>(f: (t: T) => R | undefined | null): OperatorFunction<T, R>;
export declare function finding<T>(f: (t: T) => boolean): OperatorFunction<T[], T>;
export declare function cachedMapper<TFrom, K, TTo>(keyF: (t: TFrom) => K, mapF: (t: TFrom) => TTo): ((t: TFrom) => TTo);
export declare function cachedMapperArray<TFrom, K, TTo>(keyF: (t: TFrom) => K, createF: (t: TFrom) => TTo): ((from: Array<TFrom>) => Array<TTo>);
export declare function arrayMap<X, C>(mapper: (m: X) => Observable<C>): (source: Observable<X[]>) => Observable<C[]>;
export declare function zipEmptiable<T>(...observables: Array<Observable<T>>): Observable<T[]>;
export interface Comparable<X> {
    compare(other: X): number;
}
export declare function sortingMap<X, C extends (Comparable<C> | number)>(comparatorF: (x: X) => Observable<C>): (source: Observable<X[]>) => Observable<X[]>;
export declare function promiseToObservable<T>(f: () => Promise<T>): Observable<T>;
export declare function finding$<T>(a$: Observable<T[]>, f: (t: T) => boolean): Observable<T>;
