import {BehaviorSubject, combineLatest, merge, Observable, of, OperatorFunction} from "rxjs";
import {last, map, mergeMap, pairwise, scan, share, switchMap, takeUntil} from "rxjs/operators";
import * as _ from "lodash";
import {Comparable} from "./util_rx";

export function cachedMapperArray<TFrom, K, TTo>(
  keyF: (t: TFrom) => K,
  createF: (t: TFrom) => TTo)
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
    // Update the cache
    cachePrev = cacheCur
    return output
  }
}

//
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
  : (source: Observable<Array<T>>) => Observable<Array<T>> {
  return source => source.pipe(
    pairwise(),
    map(([t0, t1]) => _.difference(t1, t0))
  )
}

export function removed<T>()
  : (source: Observable<Array<T>>) => Observable<Array<T>> {
  return source => source.pipe(
    pairwise(),
    map(([t0, t1]) => _.difference(t0, t1))
  )
}

export function undiff<T>(
  added$: Observable<Array<T>>,
  removed$: Observable<Array<T>>,
  seed: Array<T> = [])
  : Observable<Array<T>> {
  const merged$ = merge(
    added$.pipe(map(t => [true, t])) as Observable<[boolean, Array<T>]>,
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

export function sortingMap<X, C extends (Comparable<C> | number)>(
  comparatorF: (x: X) => Observable<C>)
  : (source: Observable<X[]>) => Observable<X[]> {
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

//
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