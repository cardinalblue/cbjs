import {
  asyncScheduler, BehaviorSubject,
  combineLatest,
  concat,
  defer,
  EMPTY,
  from,
  merge, MonoTypeOperatorFunction,
  Observable,
  of,
  OperatorFunction,
  SchedulerLike,
  Subscriber, timer,
  zip
} from "rxjs"
import {
  catchError,
  concatMap, delay,
  filter, first,
  flatMap,
  ignoreElements,
  last,
  map, mergeMap, pairwise,
  scan,
  share, skip,
  switchMap, take,
  takeUntil
} from "rxjs/operators"
import * as _ from "lodash"
import {LOG, withoutFirst} from "./util";

export const IDENTITY = (t: any) => t
export const PASSTHRU = (t: any) => of(t)

export type Millisec = number


// --------------------------------------------------------------------
// Operators

export function lastOrEmpty<T>() {
  return (source: Observable<T>) =>
    source.pipe(
      last(),
      catchError(err => EMPTY)
    )
}
export function filterFirst<T>() {
  return filter<T>((value: T, index: number) => index === 0)
}

export function filterTruthy<T>()
{
  return (s: Observable<T|null|undefined>) =>
    s.pipe(filter((x: T|null|undefined) => x !== null && x !== undefined)) as Observable<T>
}

// Delays passing on the Observable until the predicate Observable issues a single
// true or false.
//
export function filterObservable<T>(predicate: (input: Observable<T>) => Observable<boolean>)
  : (source: Observable<Observable<T>>) => Observable<Observable<T>>
{
  return (source: Observable<Observable<T>>) =>
    zip(
      source,
      source.pipe(
        flatMap(s =>
          predicate(s).pipe(
            first(_ => true, false)
            // WARNING: `first` is different in RxJS that in RxJava!
          ))
      ),
    )
      .pipe(
        filter(([orig, bool]: [Observable<T>, boolean]) => bool),
        map   (([orig, bool]: [Observable<T>, boolean]) => orig)
      )
}

export function detour<T, R>(
  selector: (t: T) => boolean,
  observableTrue:  ((t: T) => Observable<R>) = PASSTHRU,
  observableFalse: ((t: T) => Observable<R>) = PASSTHRU)
  : OperatorFunction<T, R>
{
  return flatMap((t: T) =>
    selector(t) ? observableTrue(t) : observableFalse(t)
  )
}
export function interject<T>(f: (t: T) => Observable<any>)
  : OperatorFunction<T,T>
{
  return concatMap((t: T) =>
    concat(
      f(t).pipe(ignoreElements()),
      of(t)
    )
  )

}

//----------------------------------------------------------------
// Delays the completion by t
//
//   ------1-------------2-----3----|
//
// will output
//
//   ------1-------------2-----3----==========|
//
//
export function extend<T>(t: Millisec, scheduler: SchedulerLike = asyncScheduler)
  : MonoTypeOperatorFunction<T>
{
  if (t <= 0) return (x) => x
  return (source: Observable<T>) => {
    return concat(
      source,
      defer(() =>
        timer(t).pipe(ignoreElements())
      )
    )
  }
}

// Redefine the RxJS `scan` so that we can have a separate initial SEED type.
// Note also the argument order is reversed.
//
export function scan2<T,R,SEED>(
  seed: SEED,
  f: (acc: R|SEED, t: T, index: number) => R,
  )
  : OperatorFunction<T, R> {
  return scan<T,R|SEED>(f, seed) as OperatorFunction<T,R>
    // OK to case because since `f` ONLY returns R, the whole thing can only
    // return R!
}

// `map` that also removes null|undefined from the output.
export function filtering<T,R>(f: (t: T) => R|undefined|null)
  : OperatorFunction<T,R>
{
  return (source: Observable<T>) =>
    source.pipe(
      map(f),
      filter(r => !!r)
    ) as Observable<R>;   // We are filtering the undefined|null
}

export function finding<T>(f: (t: T) => boolean)
  : OperatorFunction<T[], T>
{
  return filtering((a: T[]) => a.find(f))
}

// ----------------------------------------------------------------
// Given input
//
//   ------1-------------2--------------------3------------------>
//
// will output
//
//   ------1=================|2======|--------3========|--------->
//
// where the length of each is calculated by the given function.
//
export function enqueue<T>(
  durationF: (t: T) => Millisec,
  scheduler: SchedulerLike = asyncScheduler
): MonoTypeOperatorFunction<T>
{
  return (source: Observable<T>) => {
    return source.pipe(
      concatMap((x) =>
        of(x).pipe(
          extend(durationF(x))
        )
      )
    )
  }
}

// ----------------------------------------------------------------
// Accumulates the incoming values to be "active" for a fixed time.
// Outputs the current values as they become active or inactive.
//
//   ------1-------------2-----3------|
//
// will output
//
//   ------[1]=======[]--[2]===[2,3]=[3]=====|
//
//
export function prolong<T>(t: Millisec, scheduler: SchedulerLike = asyncScheduler)
  : (source: Observable<T>) => Observable<Array<T>>
{
  return (source: Observable<T>) => {
    const add$: Observable<[boolean, T]> = source.pipe(
      map(t => [true, t]))
    const del$: Observable<[boolean, T]> = source.pipe(
      delay(t, scheduler),
      map(t => [false, t]),
    )
    return merge<[boolean, T]>(add$, del$).pipe(
      scan(
        (acc: Array<T>, [op, t]: [boolean, T]) =>
          LOG(">>>> prolong ====",
            op ? [...acc, t] : withoutFirst(acc, t)
            , acc, op, t),
        []
      ),
    )
  }
}

export function doOnSubscribe<T>(onSubscribe: () => void): (source: Observable<T>) =>  Observable<T> {
  return function inner(source: Observable<T>): Observable<T> {
    return defer(() => {
      onSubscribe();
      return source;
    });
  };
}
// ---------------------------------------------------------------------------

export function cachedMapper<TFrom, K, TTo>(
  keyF: (t: TFrom) => K,
  mapF: (t: TFrom) => TTo)
  : ((t: TFrom) => TTo)
{
  const cache: Map<K, TTo> = new Map()
  return function(tFrom: TFrom) {
    const key = keyF(tFrom)
    const prev = cache.get(key)
    if (prev) { return prev; }
    // else
    const output = mapF(tFrom)
    cache.set(key, output)
    return output
  }
}

export function cachedMapperArray<TFrom, K, TTo>(
  keyF: (t: TFrom) => K,
  createF: (t: TFrom) => TTo)
  : ((from: Array<TFrom>) => Array<TTo>)
{
  type Cache = Map<K, TTo>
  let cachePrev: Cache = new Map()
  return function(tFrom: Array<TFrom>) {
    const cacheCur: Cache = new Map()
    const output = tFrom.map((tFrom: TFrom) => {
      const key = keyF(tFrom)
      const prev = cacheCur.get(key) || cachePrev.get(key)
      if (prev) {
        cacheCur.set(key, prev)
        return prev
      }
      // else
      const tTo = createF(tFrom)
      cacheCur.set(key, tTo)
      return tTo
    })
    // Update the cache
    cachePrev = cacheCur
    return output
  }
}

// ----------------------------------------------------------------
//
//
export function arrayMap<X,C>(mapper: (m: X) => Observable<C>)
  : (source: Observable<X[]>) => Observable<C[]>
{
  return (source: Observable<X[]>) => {
    const source$         = source.pipe(share());  // Turn into Hot so we can use it in takeUntil
    const sourceFinished$ = source$.pipe(last(null, true))
    return source$.pipe(switchMap((xs: X[]) => {

      // Convert each Array of elements into an Array of streams.
      const obs$ = xs.map(mapper)

      // Because combineLatest([]) returns a "nothing" Observable
      // we have to handle it especially.
      if (obs$.length === 0) {
        return of([])
      } else {
        return combineLatest(obs$).pipe(
          takeUntil(sourceFinished$)
        )
      }
    }))
  }
}

export function arraySubjectAdd<T>(subject: BehaviorSubject<Array<T>>, t: T) {
  console.log(">>>> arraySubjectAdd", t)
  subject.next(
    _.concat(subject.value, t))
}

export function arraySubjectRemove<T>(subject: BehaviorSubject<Array<T>>, t: T) {
  console.log(">>>> arraySubjectRemove", t)
  subject.next(
    _.without(subject.value, t))
}

export function added<T>()
  : (source: Observable<Array<T>>) => Observable<Array<T>>
{
  return source => source.pipe(
    pairwise(),
    map(([t0, t1]) => _.difference(t1, t0))
  )
}

export function removed<T>()
  : (source: Observable<Array<T>>) => Observable<Array<T>>
{
  return source => source.pipe(
    pairwise(),
    map(([t0, t1]) => _.difference(t0, t1))
  )
}

export function undiff<T>(
  added$: Observable<Array<T>>,
  removed$: Observable<Array<T>>,
  seed: Array<T> = [])
  : Observable<Array<T>>
{
  const merged$ = merge(
    added$.pipe  (map(t => [true,  t])) as Observable<[boolean, Array<T>]>,
    removed$.pipe(map(t => [false, t])) as Observable<[boolean, Array<T>]>,
  )
  return merged$.pipe(
    scan<[boolean, Array<T>], Array<T>>(
      (acc: Array<T>, [op, t]: [boolean, Array<T>]) =>
        op ? [...acc, ...t] : _.without(acc, ...t)
      ,
      seed
    )
  )
}

export function zipEmptiable<T>(...observables: Array<Observable<T>>) {
  if (observables.length === 0) { return of([]) }
  return zip(...observables)
}

// ----------------------------------------------------------------
//
export interface Comparable<X> {
  compare(other: X): number
}
export function sortingMap<X, C extends (Comparable<C>|number)>(
  comparatorF: (x: X) => Observable<C>)
  : (source: Observable<X[]>) => Observable<X[]>
{
  return (source: Observable<X[]>) => {
    const source$         = source.pipe(share());  // Turn into Hot so we can use it in takeUntil
    const sourceFinished$ = source$.pipe(last(null, true))
    return source$.pipe(switchMap((xs: X[]) => {

      // Convert each Array of elements into an Array of streams.
      // Each stream produces Pairs of <comparable, element> (as the comparable changes).
      const obs = xs.map((x: X) => {
        // Generate stream of comparables,
        // then pair the comparables with the original element
        return comparatorF(x).pipe(
          map((comparator) => ({comparator, x})),
        )
      })

      // Because combineLatest([]) returns a "nothing" Observable
      // we have to handle it especially.
      if (obs.length === 0) {
        return of([])
      } else {
        // Combine to form a stream of Lists of Pairs of <comparable, element>, sorted
        const compareF = (a: C, b: C) =>
          (typeof a === 'number') ? a - (<number>b) : (<Comparable<C>>a).compare(b)
        return combineLatest(obs).pipe(
          takeUntil(sourceFinished$), // Stop when the original source finished
          map((pairs: { comparator: C, x: X }[]) =>
            [...pairs].sort((a, b) => compareF(a.comparator, b.comparator))
          ),
          map((pairs: { comparator: C, x: X }[]) =>
            pairs.map((pair: { comparator: C, x: X }) => pair.x)
          )
        )
      }

    }))
  }
}

// ----------------------------------------------------------------------------
// mergingMap:
//
// Works like `mergeMap` but takes a function which can be used to produce extra
// output Observables, all of which will get merged together into one output.
// The inner function must produce at least one Observable.
//
export function mergingMap<T, R>(inner: (t: T, merging: (output$: Observable<R>) => void) => Observable<R>)
  : OperatorFunction<T, R>
{
  return mergeMap((t: T) => {
    const outputs: Observable<R>[] = []
    outputs.push(
      inner(t, (output$: Observable<R>) => outputs.push(output$))
    )
    return merge(...outputs)
  })
}

export function pairFirst<T>() {
  return (source: Observable<T>) =>
    combineLatest([
      source.pipe(take(1)),
      source.pipe(skip(1)
      )
    ]).pipe()
}



// ----------------------------------------------------------------------------
// Promise utility

export function promiseToObservable<T>(f: () => Promise<T>): Observable<T> {
  return new Observable((subs: Subscriber<Observable<T>>) => {
    const promise = f()
    subs.next(from(promise))
    subs.complete()
  })
    .pipe(flatMap(x => x))
}

// ----------------------------------------------------------------
// Utility methods

export function finding$<T>(a$: Observable<T[]>, f: (t: T) => boolean)
  : Observable<T>
{
  return a$.pipe(finding(f))
}



