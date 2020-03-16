import {
  asyncScheduler,
  combineLatest,
  concat,
  defer,
  EMPTY,
  from,
  merge,
  MonoTypeOperatorFunction,
  Observable,
  of,
  OperatorFunction,
  SchedulerLike,
  Subscription,
  timer,
  zip
} from "rxjs"
import {
  catchError,
  concatMap,
  delay,
  filter,
  first,
  flatMap,
  ignoreElements,
  last,
  map,
  scan,
  skip,
  take,
  takeUntil
} from "rxjs/operators"
import {withoutFirst} from "./util";

export const IDENTITY = (t: any) => t
export const PASSTHRU = (t: any) => of(t)

export type Millisec = number


// --------------------------------------------------------------------
// Operators

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

type Constructor = new (args: any) => any
export function filterInstanceOf<T extends Constructor>(klass: T)
{
  return (s: Observable<any>) =>
    s.pipe(filter(x => x instanceof klass)) as Observable<InstanceType<T>>
}

export function filterDefined<T>()
{
  return (s: Observable<T|null|undefined>) =>
    s.pipe(filter((x: T|null|undefined) => x !== null && x !== undefined)) as Observable<T>
}

// Delays passing on the Observable until the predicate Observable issues a single
// true or false.
// If predicate completes without issuing a true, then nothing gets passed.
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
            op ? [...acc, t] : withoutFirst(acc, t),
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

// ----------------------------------------------------------------
//

export function zipEmptiable<T>(...observables: Array<Observable<T>>) {
  if (observables.length === 0) { return of([]) }
  return zip(...observables)
}

// ----------------------------------------------------------------
//
export interface Comparable<X> {
  compare(other: X): number
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

export function swapMap<TIN, TOUT>(f: (tIn: TIN) => Observable<TOUT>)
  : OperatorFunction<TIN, TOUT>
{
  let subsCur: Subscription|undefined
  return source => {
    const input$ = source.pipe(map(f))
    return new Observable<TOUT>(subsOut => {
      const subsOuter = input$.subscribe(
        in$ => {
          // ---- Subscribe to the NEW observable,
          //      and THEN unsubscribe to the previous one
          const subsNew = in$.subscribe(
            t =>      subsOut.next(t),
            error =>  subsOut.error(error),
            () =>     { if (subsOuter.closed) subsOut.complete() },
          )
          if (subsCur) subsCur.unsubscribe()
          subsCur = subsNew
        },
        error => subsOut.error(error),
        () => { if (!subsCur) subsOut.complete() }
      )
      return () => {
        if (subsCur) {
          subsCur.unsubscribe()
          subsCur = undefined
        }
        subsOuter.unsubscribe()
      }
    })
  }


}







