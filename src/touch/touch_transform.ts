import {Point, Vector} from "../kor"
import * as _ from "lodash"
import {groupBy, intersection, keys} from "lodash"
import {TTouch, TTouchEvent} from "./touch"
import {OperatorFunction} from "rxjs"
import {map, pairwise, scan} from "rxjs/operators"
import {calculateTransformFromVectors2, ZERO_THRESHOLD} from "../util_math"
import {Elementable, ifNumber} from "../util"
import {filterDefined, pairFirst} from "../util_rx"

export class Transform implements Elementable<number> {
  move:   Point
  rotate: number
  scale:  number
  constructor({ move, rotate, scale }:
              { move?: Point, rotate?: number, scale?: number } = {}
              ) {
    this.move   = move   || Point.ZERO
    this.rotate = ifNumber(rotate, 0)
    this.scale  = ifNumber(scale,  1)
  }
  static ZERO = new Transform()
  plus(other: Transform): Transform {
    return new Transform({
      move:   this.move.rotate(other.rotate).scale(other.scale).add(other.move),
      rotate: this.rotate + other.rotate,
      scale:  this.scale * other.scale
    })
  }

  repivot(pFrom: Point, pTo: Point): Transform {
    const np = pFrom.add(this.move)
    const d1 = pTo.subtract(pFrom)
    const d2 = d1.rotate(this.rotate).scale(this.scale)
    return new Transform({ move: np.add(d2.subtract(pTo)),
      rotate: this.rotate, scale: this.scale })
  }

  get elements(): number[] {
    return [ this.move.x, this.move.y, this.rotate, this.scale ]
  }
}

export function calculateTransformFromEvents(pivot: Point,
                                             event1: TTouchEvent,
                                             event2: TTouchEvent
): Transform
{
  const touches1 = groupBy(event1.touches, 'identifier')
  const touches2 = groupBy(event2.touches, 'identifier')
  const common = intersection(keys(touches1), keys(touches2))
  if (common.length === 1) {
    const id = common[0]
    const touch1 = touches1[id][0]
    const touch2 = touches2[id][0]
    const move = touch2.point.subtract(touch1.point)
    return new Transform({ move })
  }
  else if (common.length >= 2) {
    const id1 = common[0]
    const id2 = common[1]
    const vector1 = [ touches1[id1][0].point,
                      touches1[id2][0].point ]
    const vector2 = [ touches2[id1][0].point,
                      touches2[id2][0].point ]
    const t = calculateTransformFromVectors2(pivot, vector1, vector2)
    if (t) {
      const { move, rotate, scale } = t
      return new Transform({ move, rotate, scale })
    }
    else
      return Transform.ZERO
  }
  return new Transform()
}

export function transformsFromGesture(pivot: Point = Point.ZERO)
  : OperatorFunction<TTouchEvent, Transform>
{
  return gesture => gesture.pipe(
    pairwise(),
    map(([e1, e2]) =>
      calculateTransformFromEvents(pivot, e1, e2))
  )
}

export function transformsFromGestureWithEvents(pivot: Point = Point.ZERO)
  : OperatorFunction<TTouchEvent, [Transform, TTouchEvent, TTouchEvent]>
{
  return gesture => gesture.pipe(
    pairwise(),
    map(([e1, e2]) =>
      [ calculateTransformFromEvents(pivot, e1, e2), e1, e2])
  )
}

// Will grab the first touch (hopefully the ONLY touch) from the first event
export function transformsFromRadialGesture(pivot: Point)
  : OperatorFunction<TTouchEvent, Transform>
{
  return gesture => gesture.pipe(
    scan<TTouchEvent, TTouch|undefined>(
      (prevTouch: TTouch|undefined, event: TTouchEvent) =>
        prevTouch ?
          _.find(event.touches, (t: TTouch) => t.identifier === prevTouch.identifier)
          : event.touches[0],
        undefined
      ),
    filterDefined(),
    pairFirst(),
    map(([t0, t]: [TTouch, TTouch]) => {
      const v0 = new Vector(pivot, t0.point)
      const v  = new Vector(pivot, t.point)
      const rotate = v0.angleTo(v)
      const scale  = v0.scaleTo(v)
      return new Transform({ rotate, scale })
    })
  )
}

// Will grab the first touch (hopefully the ONLY touch) from the first event
export function transformsFromDirectedGesture(pivot: Point, direction: Point)
  : OperatorFunction<TTouchEvent, Transform>
{
  return gesture => gesture.pipe(
    scan<TTouchEvent, TTouch|undefined>(
      (prevTouch: TTouch|undefined, event: TTouchEvent) =>
        prevTouch ?
          _.find(event.touches, (t: TTouch) => t.identifier === prevTouch.identifier)
          : event.touches[0],
      undefined
    ),
    filterDefined(),
    pairFirst(),
    map(([t0, t]: [TTouch, TTouch]) => {
      const v0 = new Vector(pivot, t0.point)
      const v  = new Vector(pivot, t.point)
      const d0 = v0.toPoint().dot(direction)
      const d  = v.toPoint().dot(direction)
      const scale  = d0 < ZERO_THRESHOLD ? 1 : d / d0   // Check to avoid infinity
      return new Transform({ scale })
    })
  )
}
