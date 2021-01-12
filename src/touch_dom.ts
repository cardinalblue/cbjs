import {concat, ConnectableObservable, fromEvent, merge, Observable, of, Subject, Subscription} from 'rxjs'
import {filter, map, publishReplay, refCount, share, switchMap, takeUntil, tap} from 'rxjs/operators'
import {BaseSyntheticEvent, MouseEvent, RefObject, TouchEvent, useEffect, useState} from 'react'
import {TTouch, TTouchEvent, TTouchGesture} from "./touch"
import {Point, Rect, Size} from "./kor"
import {now} from "./util"
import {log$} from "./util_rx";

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

function pointNormalized(point: Point, rect: Rect) {
  return point.subtract(rect.origin).scale(1/rect.size.x, 1/rect.size.y)
}

export function convertMouseToTouchEvent(e: MouseEvent<any>, elementRect: Rect): TTouchEvent {
  const point = new Point(e.clientX, e.clientY)
  return new TTouchEvent(
    [ new TTouch(0, point, e.button)],
    elementRect,
    now(),
    e)
}
export function convertTouchToTouchEvent(e: TouchEvent<any>, elementRect: Rect): TTouchEvent {
  const touches = []
  for (let i=0; i<e.touches.length; i++) {
    const t = e.touches.item(i)
    if (t) {
      const point = new Point(t.clientX, t.clientY)
      touches.push(new TTouch(t.identifier, point))
    }
  }
  return new TTouchEvent(touches, elementRect, now(), e)
}

export function preventDefault<T extends BaseSyntheticEvent>() {
  return tap((e: T) => e.preventDefault())
}
export function stopPropagation<T extends BaseSyntheticEvent>() {
  return tap((e: T) => e.stopPropagation())
}

// LEARN: Can examine stack: `console.log(">>>>", new Error().stack)`.

// -----------------------------------xx--------------------------------------
// Put all together into an Observable of Observables (gestures).
//
export function mouseGesturesFromEvents(mousedown$: Observable<MouseEvent>,
                                        mousemove$: Observable<MouseEvent>,
                                        mouseup$: Observable<MouseEvent>,
                                        elementRect: Rect)

  : Observable<TTouchGesture>
{
  console.log("++++ mouseGesturesFromDOM")

  // Need preventDefault otherwise will image drag
  return mousedown$.pipe(
    map(mousedown => {

      taplogT("++++ mousedown")
      const source$: Observable<TTouchEvent> =  concat(
        of(mousedown),
        mousemove$
      )
        .pipe(
          preventDefault(),
          takeUntil(mouseup$),
          map(e => convertMouseToTouchEvent(e, elementRect)),
        )
      const subject$ = source$.pipe(
        publishReplay(),
      ) as ConnectableObservable<TTouchEvent>

      subject$.connect()
      return subject$
    })
  )
}

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

export function touchGesturesFromEvents(touchstart$: Observable<TouchEvent>,
                                        elementRect: Rect)
  : Observable<TTouchGesture>
{
  console.log("++++ touchGesturesFromDOM")

  const start$ = (t: Element) => fromEvent<TouchEvent>(t, 'touchstart')
  const move$  = (t: Element) => fromEvent<TouchEvent>(t, 'touchmove')
  const end$   = (t: Element) => merge(
    fromEvent<TouchEvent>(t, 'touchend'),
    fromEvent<TouchEvent>(t, 'touchcancel'),
  ).pipe(
    share(),
  )
  const end0$  = (t: Element) => end$(t).pipe(
    filter(e => e.target === t && e.targetTouches.length === 0),
    share(),
  )
  const endN$  = (t: Element) => end$(t).pipe(
    filter(e => e.target === t && e.targetTouches.length > 0),
    share(),
  )

  // ---- An observable that sends out the given events, and then
  //      continues (as opposed to `of` which completes).
  //
  function seed<T>(...ts: T[]): Observable<T> {
    return new Observable(subs => ts.forEach(t => subs.next(t)))
  }

  // LEARN: No preventDefault/stopPropagation otherwise tapping scrolling doesn't work

  return touchstart$.pipe(
    taplogT("++++ touch start"),
    switchMap(start => {
      start.persist()     // Needed since we resend it below to keep React from reusing it
      const t = start.target as Element
      const gesture: Observable<TTouchEvent> = merge(
        of(start),
        start$(t),
        move$(t),
        endN$(t)
      ).pipe(
        takeUntil(end0$(t)),
        map(e => convertTouchToTouchEvent(e, elementRect)),
        log$(() => `++++ touch gesture ${now()}`),
        publishReplay(), refCount(),
      )
      // ---- This works together with the `exhaustMap` to prevent more than
      //      one gesture to be active at a time.
      //      Jaime 2020-12-24: Changed to using `switchMap` because it was getting
      //      stuck.
      //
      return seed(gesture).pipe(
        takeUntil(end0$(t))
      )
    })
  )
}

export function useGestures(elementRef: RefObject<HTMLElement|undefined>,
                            output$: (gesture: TTouchGesture) => void)
{
  // LEARN: gesture handling, needs to be able to handle re-renders.
  // Gesture events get lost upon re-rendering because source$ get reconnected.

  useEffect(() => {
    console.log("++++ useGestures")

    const e = elementRef.current!!

    const subs: Subscription[] = []

    if (typeof window !== "undefined" && typeof window.ontouchstart === 'undefined') {

      // ---- Subscribe to mouse events
      const mouseGesture$ = mouseGesturesFromEvents(
        fromEvent<MouseEvent>(e, 'mousedown'),
        fromEvent<MouseEvent>(e, 'mousemove'),
        fromEvent<MouseEvent>(e, 'mouseup'),
        domBoundingClientRect(e)
      )
      subs.push(mouseGesture$.subscribe(output$))
    }
    else {
      // ---- Subscribe to touch events
      const touchGesture$ = touchGesturesFromEvents(
        fromEvent<TouchEvent>(e, 'touchstart'),
        domBoundingClientRect(e)
      )
      subs.push(touchGesture$.subscribe(output$))

      // ---- Do preventDefault on the mouse events
      const mouseGesture$ = fromEvent<MouseEvent>(e, 'mousedown')
      subs.push(mouseGesture$.subscribe(e => e.preventDefault()))
    }

    return () => {
      subs.forEach(s => s.unsubscribe())
    }
  }, [elementRef, output$])
}

export function useGesturesReact(elementRef: RefObject<HTMLElement|undefined>,
                                  output$: (gesture: TTouchGesture) => void)
{
  // LEARN: React and native browsers have entirely different event
  // sequences. So should NOT mix addEventListener/fromEvents and React event
  // handlers, if you want to use stopPropagation(), etc.
  //
  // This version of `useGestures` returns React-ready event handlers.
  // See https://fortes.com/2018/react-and-dom-events/
  //

  const [state] = useState({
    mousedown$:   new Subject<MouseEvent>(),
    mousemove$:   new Subject<MouseEvent>(),
    mouseup$:     new Subject<MouseEvent>(),
    touchstart$:  new Subject<TouchEvent>(),
  })

  useEffect(() => {
    console.log("++++ useGesturesReact")

    const e = elementRef.current!!

    const subs: Subscription[] = []

    if (typeof window !== "undefined" && typeof window.ontouchstart === 'undefined') {

      // ---- Subscribe to mouse events
      const mouseGesture$ = mouseGesturesFromEvents(
        state.mousedown$,
        state.mousemove$,
        state.mouseup$,
        domBoundingClientRect(e)
      )
      subs.push(mouseGesture$.subscribe(output$))
    }
    else {
      // ---- Subscribe to touch events
      const touchGesture$ = touchGesturesFromEvents(
        state.touchstart$,
        domBoundingClientRect(e)
      )
      subs.push(touchGesture$.subscribe(output$))

      // ---- Do preventDefault on the mouse events
      subs.push(state.mousedown$.subscribe(e => e.preventDefault()))
    }
    return () => {
      subs.forEach(s => s.unsubscribe())
    }
  }, [elementRef, output$])

  return {
    onMouseDown:  (e: MouseEvent) => state.mousedown$.next(e),
    onMouseMove:  (e: MouseEvent) => state.mousemove$.next(e),
    onMouseUp:    (e: MouseEvent) => state.mouseup$.next(e),
    onTouchStart: (e: TouchEvent) => state.touchstart$.next(e),
  }
}

// -----------------------------------------------------------------------
// Utility

export function domBoundingClientRect(dom: Element): Rect {
  const domRect = dom.getBoundingClientRect()
  return new Rect(new Point(domRect.x, domRect.y),
    new Size(domRect.width, domRect.height))
}
