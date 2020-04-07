/// <reference path="./custom_matchers.d.ts"/>
import '../../setup_test'
import {TTouch, TTouchEvent} from "./touch"
import {$P} from "./kor"
import {calculateTransformFromEvents, Transform, transformsFromRadialGesture} from "./touch_transform"
import {expectElem, testScheduler} from "../../setup_test"
import {Observable} from "rxjs"

const $E  = function(touches: TTouch[]) { return new TTouchEvent(touches, 1); }
const $T  = function(id: number, x: number, y: number) { return new TTouch(id, $P(x, y)); }
it('calculateTransformFromEvents drags one finger ok', () => {
  expectElem(calculateTransformFromEvents(
    $P(2, 1),
    $E([$T(1,5, 1)]),
    $E([$T(1,3, -5)])
    ))
    .toBeEnumerableCloseTo(new Transform({ move: $P(-2, -6), rotate: 0, scale: 1 }).elements)
})
it('calculateTransformFromEvents transforms simply', () => {
  expectElem(calculateTransformFromEvents(
    $P(2, 1),
    $E([$T(1, 5, 1),  $T(2, 9, 1) ]),
    $E([$T(1, 3, -5), $T(2, 3, -9)]),
    ))
    .toBeEnumerableCloseTo(new Transform({ move: $P(1, -3), rotate: -Math.PI/2, scale: 1 }).elements)
})
it('calculateTransformFromEvents transforms more', () => {
  expectElem(calculateTransformFromEvents(
    $P(2, 2),
    $E([$T(1, 6, -1), $T(2, 9, 1) ]),
    $E([$T(1, -3, 3), $T(2, -7, 9)]),
  ))
    .toBeEnumerableCloseTo(new Transform({ move: $P(-11, -7), rotate: Math.PI/2, scale: 2 }).elements)
})
it('calculateTransformFromEvents transforms more', () => {
  const scheduler = testScheduler()
  scheduler.run(helpers => {
    const {cold, expectObservable: ex} = helpers
    // Typescript bindings for `cold` are wrong, so have to patch
    function _cold<T>(marbles: string, values: T[]): Observable<T> {
      return cold(marbles, <{ [key: string]: T }>(values as any))
    }

    ex(
      _cold('---0----1-2---', [
        $E([$T(10, 8, 5)]),
        $E([$T(11, 60, 50), $T(10, 1, 9)]),
        $E([$T(12, 60, 50), $T(10, 5, 1)]),
      ]).pipe(
        transformsFromRadialGesture($P(4,3))
      )
    )
      .toBe('--------0-1---', [
        new Transform({ rotate: Math.PI/2, scale: 1.5 }),
        new Transform({ rotate: -Math.PI/2, scale: 0.5 }),
      ])
  })
})