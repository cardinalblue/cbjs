import '../setup_test'
import {TTouch, TTouchEvent} from "./touch";
import {Point, Rect} from "./kor";
import {testScheduler} from "../setup_test";
import {isDragOrPinch, isPinch$} from "./touch_gesture";
import {delay, takeUntil} from "rxjs/operators";

let identifier = 1

function $T(x: number, y: number) { return new TTouch(++identifier, new Point(x,y)); }
function $E(touches: TTouch[])    { return new TTouchEvent(touches, Rect.ZERO); }

it('isDragOrPinch works', () => {

  const scheduler = testScheduler()
  scheduler.run(helpers => {
    const {cold, expectObservable: ex} = helpers

    const in$ = cold("-a-b-c-d-e-f-g", {
      a: $E([$T(1, 1)]),
      b: $E([$T(1, 1)]),
      c: $E([$T(1, 1), $T(1, 1)]),
      d: $E([$T(1, 12)]),
      e: $E([$T(1, 12)]),
      f: $E([$T(12, 1)]),
      g: $E([$T(3, 3)]),
    })
    ex(in$.pipe(isDragOrPinch(10)))
      .toBe("---f-t-t-t-t-f", { f: false, t: true })

  })
})

it('how delay works', () => {
  let identifier = 1

  const scheduler = testScheduler()
  scheduler.run(helpers => {
    const {cold, expectObservable: ex} = helpers

    const long$  = cold('a--------')
    const stop1$ = cold('-----b---')
    const stop2$ = cold('---|')

    ex(long$.pipe(takeUntil(stop1$)))
      .toBe('a----|')
    ex(long$.pipe(takeUntil(stop2$)))
      .toBe('a-------')
    ex(long$.pipe(delay(3), takeUntil(stop1$)))
      .toBe('---a-|')
    ex(long$.pipe(delay(7), takeUntil(stop1$)))
      .toBe('-----|')
    ex(long$.pipe(delay(7), takeUntil(stop2$)))
      .toBe('-------a')

  })
})

it('triggerPinch works', () => {
  const scheduler = testScheduler()
  scheduler.run(({cold, expectObservable: ex}) => {

    ex(cold("--a------|", { a: $E([$T(0,0)]) }).pipe(isPinch$(30)))
      .toBe("---------(a|)", { a: false })
    ex(cold("--a------|", { a: $E([$T(0,0)]) }).pipe(isPinch$(5)))
      .toBe("-----(a|)", { a: false })
    ex(cold("--a--b-c--|", { a: $E([$T(0,0)]),
                             b: $E([$T(1,1)]),
                             c: $E([$T(2,2), $T(3,3)])
                             }).pipe(isPinch$(30)))
      .toBe("-------(a|)", { a: true })
  })

})