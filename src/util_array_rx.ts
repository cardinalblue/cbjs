import {BehaviorSubject, combineLatest, merge, Observable, of, OperatorFunction} from "rxjs";
import {last, map, mergeMap, pairwise, scan, share, switchMap, takeUntil} from "rxjs/operators";
import * as _ from "lodash";


export function arrayEquals<T>(a1: T[], a2: T[]): boolean {
  if (a1.length !== a2.length)
    return false
  return a1.every((t, i) => t === a2[i])
}

export function cachedArrayMapper<TFrom, K, TTo>(
  keyF: (t: TFrom) => K,
  createF: (t: TFrom) => TTo,
  disposeF: (t: TTo) => void = (_) => {}
  )
  : ((from: Array<TFrom>) => Array<TTo>) {
  type Cache = Map<K, TTo>
  let cachePrev: Cache = new Map()
  return function (tFrom: Array<TFrom>) {
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
    // Clean up the difference
    const difference = _.difference(Array.from(cachePrev.values()),
                                    Array.from(cacheCur.values()))
    difference.forEach(i => disposeF(i))

    // Update the cache
    cachePrev = cacheCur
    return output
  }
}

export function arraySubjectAdd<T>(subject: BehaviorSubject<Array<T>>, t: T) {
  subject.next(
    _.concat(subject.value, t))
}

export function arraySubjectRemove<T>(subject: BehaviorSubject<Array<T>>, t: T) {
  subject.next(
    _.without(subject.value, t))
}

export function added<T>()
  : (source: Observable<Array<T>>) => Observable<Array<T>> {
  return source => source.pipe(
    pairwise(),
    map(([t0, t1]) => _.difference(t1, t0)),
  )
}

export function removed<T>()
  : (source: Observable<Array<T>>) => Observable<Array<T>> {
  return source => source.pipe(
    pairwise(),
    map(([t0, t1]) => _.difference(t0, t1)),
  )
}

export function undiff<T>(
  added$: Observable<Array<T>>,
  removed$: Observable<Array<T>>,
  seed: Array<T> = [])
  : Observable<Array<T>> {
  const merged$ = merge(
    added$  .pipe(map(t => [true,  t])) as Observable<[boolean, Array<T>]>,
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

export function compareDefault<T>(a: T|undefined, b: T|undefined): number {
  function defined<T>(x: T|undefined): x is T {
    return x !== undefined;
  }
  if (!defined(a)) {
    if (!defined(b)) return 0
    return -1
  }
  else {
    if (!defined(b)) return 1
    return a === b ? 0 : a < b ? -1 : 1;
  }
}

/**
 * Comparison function to use when sorting array of arrays.
 */
export function compareArray<T>(a: T[], b: T[],
                                compareF: (a: T|undefined, b: T|undefined) => number = compareDefault)
  : number
{
  const len = Math.max(a.length, b.length)

  for (let i=0; i<=len ;i++) {
    const A = a[i]
    const B = b[i]
    const c = compareF(A, B)
    if (c !== 0)
      return c
  }
  return 0
}

export function sortingMap<X, C>(
  comparatorF: (x: X) => Observable<C>,
  compareF: (c1: C, c2: C) => number = (a: any, b: any) => (a - b)
  )
  : (source: Observable<X[]>) => Observable<X[]>
{
  return (source: Observable<X[]>) => {
    const source$ = source.pipe(share());  // Turn into Hot so we can use it in takeUntil
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

// ------------------------------------------------------------
// mergingMap:
//
// Works like `mergeMap` but takes a function which can be used to produce extra
// output Observables, all of which will get merged together into one output.
// The inner function must produce at least one Observable.

export function mergingMap<T, R>(inner: (t: T, merging: (output$: Observable<R>) => void) => Observable<R>)
  : OperatorFunction<T, R> {
  return mergeMap((t: T) => {
    const outputs: Observable<R>[] = []
    outputs.push(
      inner(t, (output$: Observable<R>) => outputs.push(output$))
    )
    return merge(...outputs)
  })
}

export function arrayMap<X, C>(mapper: (m: X) => Observable<C>)
    : (source: Observable<X[]>) => Observable<C[]> {
  return (source: Observable<X[]>) => {
    const source$ = source.pipe(share());  // Turn into Hot so we can use it in takeUntil
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

export function arrayFilterMap<X>(mapper: (m: X) => Observable<Boolean>)
    : (source: Observable<X[]>) => Observable<X[]> {
  return (source: Observable<X[]>) => {
    return source.pipe(
        arrayMap(item => mapper(item).pipe(
            map(b => [b, item] as [boolean, X]),
        )),
        map(tuples => {
          return tuples
              .filter(([b, _]) => b)
              .map(([_, item]) => item)
        })
    )

  }
}
