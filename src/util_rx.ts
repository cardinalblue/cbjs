import {combineLatest, concat, EMPTY, from, Observable, of, OperatorFunction, Subscriber, zip} from "rxjs"
import {
  catchError,
  concatMap,
  filter,
  flatMap,
  ignoreElements,
  last,
  map,
  scan,
  share,
  switchMap,
  takeUntil
} from "rxjs/operators"

export const IDENTITY = (t: any) => t
export const PASSTHRU = (t: any) => of(t)

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



