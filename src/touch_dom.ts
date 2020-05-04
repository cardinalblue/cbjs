import {concat, ConnectableObservable, fromEvent, merge, Observable, of, Subscription} from 'rxjs'
import {exhaustMap, filter, map, publishReplay, refCount, share, takeUntil, tap} from 'rxjs/operators'
import {Point} from './kor'
import {TTouch, TTouchEvent, TTouchGesture} from './touch'
import {BaseSyntheticEvent, MouseEvent, RefObject, TouchEvent, useEffect} from 'react'
import {log$, now, taplog} from "./util";

// ---- Button event codes (https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button)
export const BUTTON_MAIN      = 0
export const BUTTON_AUXILIARY = 1
export const BUTTON_SECONDARY = 2

// ---- Commit the event
TTouchEvent.commit = (e: TTouchEvent|null) => {
  if (e && typeof e.platform.preventDefault === 'function') {
    e.platform.preventDefault()
    e.platform.stopPropagation()
  }
}

// -------------------------------------------------------------------------

export function taplogT<X>(label: string, ...vars: any[])
  : (s: Observable<X>) => Observable<X> {
  return (s: Observable<X>) => s.pipe(
    tap(x => console.log(label, x, now(), ...vars))
  )
}

// -------------------------------------------------------------------------
// Convert React events to our own events.
//
export function convertMouseToTouchEvent(e: MouseEvent<any>): TTouchEvent {
  return new TTouchEvent(
    [ new TTouch(0, new Point(e.clientX, e.clientY), e.button)],
    now(),
    e)
}
export function convertTouchToTouchEvent(e: TouchEvent<any>): TTouchEvent {
  const touches = []
  for (let i=0; i<e.touches.length; i++) {
    const t = e.touches.item(i)
    if (t) {
      touches.push(new TTouch(t.identifier, new Point(t.clientX, t.clientY)))
    }
  }
  return new TTouchEvent(touches, now(), e)
}

export function preventDefault<T extends BaseSyntheticEvent>() {
  return tap((e: T) => e.preventDefault())
}
export function stopPropagation<T extends BaseSyntheticEvent>() {
  return tap((e: T) => e.stopPropagation())
}

// -------------------------------------------------------------------------
// Put all together into an Observable of Observables (gestures).
//
export function mouseGesturesFromDOM(dom: Element)
  : Observable<TTouchGesture>
{
  console.log("++++ mouseGesturesFromDOM")

  // LEARN: Can examine stack: `console.log(">>>>", new Error().stack)`.

  // ---- Because
  const mousedown$   = fromEvent<MouseEvent>(dom, 'mousedown')
  const mousemove$   = fromEvent<MouseEvent>(document, 'mousemove')
  const mouseup$     = fromEvent<MouseEvent>(document, 'mouseup')

  // Need preventDefault otherwise will image drag
  return mousedown$.pipe(
    map(mousedown => {

      console.log("++++ mousedown")
      const source$: Observable<TTouchEvent> =  concat(
        of(mousedown),
        mousemove$
      )
      .pipe(
        preventDefault(),
        takeUntil(mouseup$),
        map(e => convertMouseToTouchEvent(e)),
      )
      const subject$ = source$.pipe(
        publishReplay(),
      ) as ConnectableObservable<TTouchEvent>

      subject$.connect()
      return subject$
    })
  )
}

export function touchGesturesFromDOM(dom: Element)
  : Observable<TTouchGesture>
{
  console.log("++++ touchGesturesFromDOM")

  // LEARN: Touch behavior matters which target:
  // https://stackoverflow.com/questions/33298828/touch-move-event-dont-fire-after-touch-start-target-is-removed
  // So we have to attach the `touchmove` and `touchend` handlers to the
  // *exact* event target that did the `touchstart`.
  //
  // LEARN: `touchend` only happens for fingers that were started in that
  // target, and not for other fingers. It only happens when the the original
  // finger lifts up.
  // That's why we use `targetTouches`.
  //
  // LEARN:
  //   TouchEvent:
  //     - target:        bottom-most Element that received the touch (even if bubbled up)
  //     - targetTouches: current touches (out of all of them) that are of the 'target'.
  //     - touches:       all the touches on the screen.
  //
  //   Subsequent fingers can be "started" on other Elements, dependent on where
  //   they start.
  //   TouchEvents/Touches keep the `target` they started at.
  //
  //   Events start at a handler and then bubble up to the handlers, but keep
  //   the same target.
  //

  // LEARN: `takeUntil` works differently in RxJS and RxJava, the EMPTY control
  // behavior!!!

  const start$ = (t: any) => fromEvent<TouchEvent>(t, 'touchstart')
  const move$  = (t: any) => fromEvent<TouchEvent>(t, 'touchmove')
  const end$   = (t: any) => merge(
    fromEvent<TouchEvent>(t, 'touchend'),
    fromEvent<TouchEvent>(t, 'touchcancel'),
  ).pipe(
    share(),
  )
  const end0$  = (t: any) => end$(t).pipe(
    filter(e => e.target === t && e.targetTouches.length === 0),
    share(),
  )
  const endN$  = (t: any) => end$(t).pipe(
    filter(e => e.target === t && e.targetTouches.length > 0),
    share(),
  )

  function seed<T>(...ts: T[]): Observable<T> {
    return new Observable(subs => ts.forEach(t => subs.next(t)))
  }

  // LEARN: No preventDefault/stopPropagation otherwise tapping scrolling doesn't work

  return start$(dom).pipe(
    taplog("++++ touch start"),
    exhaustMap(start => {
      const t = start.target
      const gesture: Observable<TTouchEvent> = merge(
        of(start),
        start$(t),
        move$(t),
        endN$(t)
      ).pipe(
        takeUntil(end0$(t)),
        map(convertTouchToTouchEvent),
        log$(`++++ touch gesture ${now()}`),
        publishReplay(), refCount(),
      )
      // ---- This works together with the exhaustMap to prevent more than
      //      one gesture to be active at a time.
      //
      return seed(gesture).pipe(
        takeUntil(end0$(t))
      )
    })
  )
}

export function useGestures(elementRef: RefObject<HTMLElement|undefined>,
                            output: (gesture: TTouchGesture) => void)
{
  // LEARN: gesture handling, needs to be able to handle re-renders.
  // Gesture events get lost upon re-rendering because source$ get reconnected.

  useEffect(() => {
    console.log("++++ useGestures")

    const e = (console.assert(elementRef.current), elementRef.current!!)

    const subs: Subscription[] = []

    if (typeof window !== "undefined" && typeof window.ontouchstart === 'undefined') {
      subs.push(mouseGesturesFromDOM(e).subscribe(output))
    }
    else {
      // Subscribe to touch and then preventDefault on the mouse events
      subs.push(
        touchGesturesFromDOM(e)
          .subscribe(output))
      subs.push(
        fromEvent<MouseEvent>(e, 'mousedown')
          .subscribe(e => e.preventDefault())
      )
    }

    return () => {
      subs.forEach(s => s.unsubscribe())
    }
  }, [elementRef, output])
}