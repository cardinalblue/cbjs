import * as _ from "lodash"
import {
  asyncScheduler,
  BehaviorSubject,
  combineLatest,
  concat,
  defer,
  EMPTY,
  from,
  merge,
  MonoTypeOperatorFunction,
  Observable,
  ObservableInput,
  ObservedValueOf,
  of,
  OperatorFunction,
  pipe,
  SchedulerLike,
  Subscription,
  timer,
  zip
} from "rxjs"
import {
  catchError,
  concatMap,
  delay,
  endWith,
  expand,
  filter,
  finalize,
  first,
  ignoreElements,
  last,
  map,
  mergeMap,
  scan,
  skip,
  startWith,
  switchMap,
  take,
  takeUntil,
  tap,
} from "rxjs/operators"
import {Constructable, objectFromArray, objectToArray, withoutFirst} from "./util";

export const IDENTITY = (t: any) => t
export const PASSTHRU = (t: any) => of(t)

export type Millisec = number


// --------------------------------------------------------------------
// Operators

export function taplog<T>(s: string|((t: T|undefined) => string), ...vars: any[])
  : (s: Observable<T>) => Observable<T>
{
  function S(t?: T) {
    return (typeof s === 'function') ? [s(t)] : [s, t]
  }
  return pipe(
    tap(t => console.log(...S(t), ...vars))
  )
}

export function tapWithIndex<T>(action: (t: T, index: number) => any)
  : MonoTypeOperatorFunction<T>
{
  return map((t: T, index: number) => {
    action(t, index)
    return t
  })
}

export function tapScan<T,R,SEED>(seed: SEED, f: (acc: R|SEED, t: T, index: number) => R)
    : MonoTypeOperatorFunction<T>
{

  type R_INNER    = { acc: R|SEED, t: T }
  type SEED_INNER = { acc: SEED }

  return (source: Observable<T>) => source.pipe(
      scan2({ acc: seed },
          (acc: R_INNER|SEED_INNER, t: T, index: number) => {
            const inner = f(acc.acc, t, index)
            return { acc: inner, t }
          }),
      map(({ t }: R_INNER) => t)
  )
}

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

export function takeDuring<T,C>(control$: Observable<C>): MonoTypeOperatorFunction<T> {
  const stop$ = control$.pipe(last(_ => false, true))
  return takeUntil(stop$)
}

export function postponeUntil<T,S>(signal: Observable<S>)
    : MonoTypeOperatorFunction<T>
{
  return (source: Observable<T>) =>
      zip(source, signal).pipe(
          first(),
          map(([t, s]) => t)
      )
}

export function filterInstanceOf<TIN, T extends Constructable>(klass: T)
{
  return (s: Observable<TIN>) =>
    s.pipe(filter(x => x instanceof klass)) as Observable<InstanceType<T>>
}
export function filterIs<TIN, TOUT extends TIN>(f: ((t: TIN) => t is TOUT)):
  OperatorFunction<TIN, TOUT>
{
  return filter(f) as OperatorFunction<TIN, TOUT>
}

export function filterDefined<T>() {
  return (s: Observable<T|null|undefined>) =>
    s.pipe(filter((x: T|null|undefined) => x !== null && x !== undefined)) as Observable<T>
}

export function flipBoolean(): OperatorFunction<boolean, boolean> {
  return map(b => !b)
}

// Delays passing on the Observable until the predicate Observable issues a single
// true or false.
// If predicate completes without issuing a true, then nothing gets passed.
//
export function filterObservable<T>(predicate: (input: T) => Observable<boolean>)
  : (source: Observable<T>) => Observable<T>
{
  return (source: Observable<T>) =>
    zip(
      source,
      source.pipe(
        mergeMap(s =>
          predicate(s).pipe(
            first(_ => true, false)
            // WARNING: `first` is different in RxJS that in RxJava!
          ))
      ),
    )
      .pipe(
        filter(([orig, bool]: [T, boolean]) => bool),
        map   (([orig, bool]: [T, boolean]) => orig)
      )
}

export function detour<T, R>(
  selector: (t: T) => boolean,
  observableTrue:  ((t: T) => Observable<R>) = PASSTHRU,
  observableFalse: ((t: T) => Observable<R>) = PASSTHRU)
  : OperatorFunction<T, R>
{
  return mergeMap((t: T) =>
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
// The input:
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
    const merged$: Observable<[boolean, T]> = merge(add$, del$)
    return merged$.pipe(
      scan(
        (acc: Array<T>, [op, t]: [boolean, T]) =>
            op ? [...acc, t] : withoutFirst(acc, t),
        []
      ),
    )
  }
}

// ----------------------------------------------------------------
// Extends a trigger signal for t.
// The input:
//
//   ------1-------------2-----3------|
//
// will output
//
//   ------T=======F-----T=============F-------|
//
//
export function isProlonged(t: Millisec)
  : OperatorFunction<any, boolean>
{
  return source => source.pipe(
    prolong(t),
    map(vs => vs.length > 0),
  )
}

// ---------------------------------------------------------------------------

export function cachedMapper<TFrom, TTo>(
  keyF: keyof TFrom | ((t: TFrom) => any),
  mapF: (t: TFrom) => TTo)
  : ((t: TFrom) => TTo)
{
  const cache: Map<any, TTo> = new Map()

  const _keyF = keyF instanceof Function ? keyF : (t: TFrom) => t[keyF]

  return function(tFrom: TFrom) {
    const key = _keyF(tFrom)
    const prev = cache.get(key)
    if (prev) { return prev; }
    // else
    const output = mapF(tFrom)
    cache.set(key, output)
    return output
  }
}

// ----------------------------------------------------------------
//

export function zipEmptiable<T>(...observables: Array<Observable<T>>) {
  if (observables.length === 0) { return of([]) }
  return zip(...observables)
}

// ----------------------------------------------------------------------------

export function pairFirst<T>() {
  return (source: Observable<T>) =>
    combineLatest([
      source.pipe(take(1)),
      source.pipe(skip(1)),
    ]).pipe()
}

// ----------------------------------------------------------------------------


export function combineLatestWithEmpty<T>(arr: Array<Observable<T>>) {
  return arr.length ?
    combineLatest(arr) :
    of([])
}

export function combineLatestWithChanges<T1, T2>(arr: [Observable<T1>, Observable<T2>])
  : Observable<[[T1, T2], (T1|T2)[]]>;
export function combineLatestWithChanges<T>(arr: Array<Observable<T>>): Observable<[T[], T[]]> {
  var version = 0
  const arrV$ = arr.map(
    s => s.pipe(
      map(e => [e, ++version] as [T, number])
    )
  )
  const x$ = combineLatestWithEmpty(arrV$).pipe(
    map(
      (arrV: [T, number][]) => [
        arrV.map(([t, number]) => t),
        arrV.length ? [ _.maxBy(arrV, ([t, n]) => n)!![0] as T ] : []
      ] as [T[], T[]]
    )
  )
  return x$
}


// ----------------------------------------------------------------------------
// Promise utility

export function promise$<T>(f: () => Promise<T>): Observable<T> {
  return defer(() => from(f()))
}

// ----------------------------------------------------------------
// Utility methods

export function finding$<T>(a$: Observable<T[]>, f: (t: T) => boolean)
  : Observable<T>
{
  return a$.pipe(finding(f))
}

// =======================================================================

export function swapMap<T, O extends ObservableInput<any>>(f: (tIn: T, index: number) => O)
  : OperatorFunction<T, ObservedValueOf<O>>
{
  let subsCur: Subscription|undefined
  return source => {
    const input$ = source.pipe(map(f))
    return new Observable<ObservedValueOf<O>>(subsOut => {

      let subsSource: Subscription|undefined
        // Might complete DURING subscribe so initialize to undefined
      subsSource  = input$.subscribe(

        // ---- Incoming
        in$ => {
          // ---- Subscribe to the NEW observable,
          //      and THEN unsubscribe to the previous one
          const subsNew = from(in$).subscribe(
            (t: ObservedValueOf<O>) => subsOut.next(t),
            (error: any) =>  subsOut.error(error),
            () =>     { if (subsSource && subsSource.closed) subsOut.complete() },
          )
          if (subsCur) subsCur.unsubscribe()
          subsCur = subsNew
        },

        // ---- Error
        error => subsOut.error(error),

        // ---- Complete
        () => { if (!subsCur || subsCur.closed) subsOut.complete() }
      )
      return () => {
        if (subsCur) {
          subsCur.unsubscribe()
          subsCur = undefined
        }
        subsSource?.unsubscribe()
      }
    })
  }
}

// --------------------------------------------------------------------
// Flattening

export function flattenObject<TIN, TOUT>(
  f: (tIn: TIN) => Observable<TOUT>
): (source: Observable<{ [s: string]: TIN }>) => Observable<{ [s: string]: TOUT }> {
  return pipe(
    map(objectToArray),
    map(a =>
      a.map(([k, v]) =>
        f(v).pipe(
          map(tOut => [k, tOut])
        )
      )
    ),
    mergeMap(obs => combineLatest(obs) as Observable<[[string, TOUT]]>),
    map(objectFromArray)
  )
}

export function flattenArray<TIN, TOUT>(
  f: (tIn: TIN) => Observable<TOUT>
): (source: Observable<TIN[]>) => Observable<TOUT[]> {
  return (source: Observable<TIN[]>) => source.pipe(
    switchMap((ts: TIN[]) =>
      ts.length > 0 ? combineLatest(ts.map(t => f(t))) : of([])
    )
  )
}

export function repeating<T>(
  f: T | ((n: number) => T),
  dueTime: number | Date = 0,
  scheduler: SchedulerLike=asyncScheduler,
  period?: number,
): Observable<T> {
  const t$ = period ? timer(dueTime, period, scheduler) : timer(dueTime, scheduler)
  return t$.pipe(
    map(n =>
      (f instanceof Function ? f(n) : f) as T
    )
  );
}

export function nextIfNotEqual<T>(value: T, dest: BehaviorSubject<T>) {
  if (!_.isEqual(value, dest.value)) dest.next(value)
}

// -------------------------------------------------------------------------
// Progress
//
// Usage
//
//     const progresses$ = new Subject<Progress>
//
//     longProcess1$.pipe(
//       progressFork(progress => progresses$.next(progress)
//     ).subscribe(...)
//
//     longProcess2$.pipe(
//       progressFork(progress => progresses$.next(progress)
//     ).subscribe(...)
//
//     const count$ = progresses$.pipe(
//       progressCount()
//     )
//     // count$ will be 0...1...0...1....2...3...2...1..0......
//

export type Progress = Observable<string|null>
export function progressFork<T>(f: (p: Progress) => void,
                                status: (t: T) => string|null = () => null)
  : MonoTypeOperatorFunction<T>
{
  const p = new BehaviorSubject<string|null>(null)
  return (source: Observable<T>) => source.pipe(
    doOnSubscribe(() => f(p)),
    tap(t => p.next(status(t))),
    finalize(() => p.complete()),
  )
}

export function log$<T>(s: string|((t: T|undefined) => string), ...vars: any[]) {
  function S(t?: T) {
    return (typeof s === 'function') ? s(t) : s
  }
  return (source: Observable<T>) => source.pipe(
    doOnSubscribe(() => console.log(S(), "subscribe", ...vars)),
    finalize(     () => console.log(S(), "finalize", ...vars)),
    tap(
      t => console.log(S(t), t, ...vars),
      error => console.error(S(), error, ...vars)
    ),
  )
}

export function doOnSubscribe<T>(f: () => void)
  : MonoTypeOperatorFunction<T>
{
  return (source: Observable<T>) => {
    return defer(() => {
      f();
      return source;
    });
  };
}


export function progressCount(): OperatorFunction<Progress, number>
{
  return (source: Observable<Progress>) =>
    source.pipe(
      mergeMap(p => p.pipe(
        ignoreElements(),
        startWith(1),
        endWith(-1),
      )),
      scan2(0, (count: number, n: number) => count + n),
      startWith(0),
    )
}

export type BS$<T> = BehaviorSubject<T>

export function Unit<T>() {
  return (input: T) => input
}

export function paginate$<T, CURSOR>(
  f$: (cursor: CURSOR|null, n: number) => Observable<[CURSOR, Array<T>]>,
  limit: number
)
  : Observable<Array<T>>
{
  return of<[CURSOR|null, Array<T>]>([null, []]).pipe(
    expand(([cursor, acc]: [CURSOR|null, Array<T>]) =>
      acc.length < limit ?
        f$(cursor, limit - acc.length).pipe(
          filter(([_, newData]) => newData.length > 0),
          map(([nextCursor, newData]) =>
            [nextCursor, acc.concat(newData)] as [CURSOR|null, Array<T>]
          ),
          catchError(() => EMPTY)
        )
        : EMPTY
    ),
    map(([_, acc]: [CURSOR|null, Array<T>]) => acc),
  )
}

export function toggleBehaviorSubject($: BehaviorSubject<boolean>) {
  $.next(!$.value)
}
