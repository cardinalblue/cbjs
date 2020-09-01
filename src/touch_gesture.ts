import {Millisec, pairFirst} from "./util_rx"
import {now} from "./util"
import {interval, Observable, OperatorFunction, zip} from "rxjs"
import {delay, every, filter, first, map, pairwise, take, takeUntil} from "rxjs/operators"
import {TTouch, TTouchEvent, TTouchGesture} from "./touch"
import {taplogT} from "./touch_dom";
import {Point} from "./kor";
import {Widget} from "./widget";

export class TTap<PlatformEvent=any> {
  constructor(readonly touch: TTouch,                             // The first touch of the tap
              readonly tStart: Millisec = now(), // Time that the first tap happened
              readonly tPress: Millisec = 0,                      // How long the press was
              readonly event: TTouchEvent|null  = null
              ) {
  }

}

export class TPress<PlatformEvent=any> {
  // eslint-disable-next-line no-useless-constructor
  constructor(readonly touch: TTouch,     // The first touch of the tap
              readonly tStart: Millisec,  // Time that the first tap happened
              readonly tPress: Millisec,  // How long the press was
              readonly event: TTouchEvent|null  = null
              ) {
  }
}

// Observable of true/false based on the first event of the source.
//
export function detectFirst<T>(f: (t: T|null) => boolean)
  : OperatorFunction<T, boolean>
{
  return (source: Observable<T>) => source.pipe(
    first(null, null),
    map((t: T|null) => f(t)),
  )
}

// Returns a `true` the first time the gesture is detected multi-finger pinch,
// or a `false` if gesture ends of after a timeout.
//
export function isPinch$(timeout: Millisec): OperatorFunction<TTouchEvent, boolean>
{
  return (source: Observable<TTouchEvent>) =>
    source.pipe(
      filter(e => e.touches.length >= 2),
      map(_ => true),
      takeUntil(interval(timeout)),
      first(_ => _, false),
    )
}

export function hasButton$(button: number): OperatorFunction<TTouchEvent, boolean> {
  return source =>
    source.pipe(
      map(e => {
        const b = e.touches && e.touches[0] && e.touches[0].button;
        return b === button
      }),
      first(b => b, false),
    )
}

// Returns a `true` the first time the gesture is detected to be a drag/pinch,
// or a `false` at the end if not detected.
//
export function detectDragOrPinch(maxDrag: number)
  : OperatorFunction<TTouchEvent, boolean>
{
  return (source: Observable<TTouchEvent>) => source.pipe(
    isDragOrPinch(maxDrag),
    first(_ => _, false),
  )
}

// Returns a true or false for each event if the new event would be considered
// a drag/pinch.
//
export function isDragOrPinch(maxDrag: number)
  : OperatorFunction<TTouchEvent, boolean>
{
  // Produces true for each event corresponds to a drag or pinch or not.
  const maxDrag2 = maxDrag * maxDrag
  return (source: Observable<TTouchEvent>) => source.pipe(
    pairFirst(),
    map(([eventFirst, event]) => {
      if (eventFirst.touches.length !== 1 || event.touches.length !== 1)
        return true
      else {
        const t1: TTouch = eventFirst.touches[0]
        const t2: TTouch = event.touches[0]
        const v = t1.point.subtract(t2.point)
        const d = v.magnitude2()
        return (d > maxDrag2)
      }
    }),
  )
}

export function tapsFromGesture(gesture: TTouchGesture, maxDrag: number = 10.0)
  : Observable<TTap> {

  // Only true at end of gesture if throughout if all no drag or pinch
  const valid = gesture.pipe(
    isDragOrPinch(maxDrag),
    every(b => !b),
    filter(b => b)
  )
  // Zip this signal with the first and last events, and from them
  // produce the tap.
  return zip(
    valid,
    gesture.pipe(first())
  ).pipe(
    map(([valid, eFirst]: [boolean, TTouchEvent]) =>
      new TTap(eFirst.touches[0],
               eFirst.t,
               now() - eFirst.t,
               eFirst
      ))
  )
}

export function doubleTaps<T>(duration: number, distance: number)
  : OperatorFunction<TTap, TTap[]>
{
  return src$ => src$.pipe(
    pairwise(),
    filter(taps => {
      const tap0 = taps[0]
      const tap1 = taps[1]

      const t0 = tap0.tStart
      const t1 = tap1.tStart
      const p0 = tap0.touch.point
      const p1 = tap0.touch.point

      return (
        t1 - t0 <= duration &&
       p0.distanceWithin(p1, distance)
      )
    })
  )
}

export function pressesFromGesture(gesture: TTouchGesture,
                                   maxDuration: number,
                                   maxDrag: number = 10.0)
  : Observable<TPress> {

  const g$ = gesture
  const stop$ = g$.pipe(
    detectDragOrPinch(maxDrag),
  )
  return g$.pipe(
    take(1),
    delay(maxDuration),
    takeUntil(stop$),
    map(eFirst =>
      new TPress(eFirst.touches[0],
        eFirst.t,
        now() - eFirst.t,
        eFirst
      )
    ),
    taplogT("++++ press"),
  )

}

