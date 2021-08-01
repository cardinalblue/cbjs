// ------------------------------------------------------
// See:
//  https://stackoverflow.com/a/63990350/304734
//  https://www.typescriptlang.org/docs/handbook/advanced-types.html
// on how
// to manipulate and filter types.
//
//
// ---- These get the Observable/Subject/BehaviorSubject types
import {BehaviorSubject, Observable, Subject} from "rxjs";

type unObservable<T> = T extends Observable<infer J> ? J : T
type unSubject<T> = T extends Subject<infer J> ? J : T
type unBehaviorSubject<T> = T extends BehaviorSubject<infer J> ? J : T

export type SubsetBehaviorSubject$<T> = {
  [K in keyof T as (T[K] extends BehaviorSubject<any> ? K : never)]:
    T[K] extends BehaviorSubject<any> ? unBehaviorSubject<T[K]> : T[K]
};

export type PartialExceptFor<T, TRequired extends keyof T> =
  Partial<T> & Pick<T, TRequired>

