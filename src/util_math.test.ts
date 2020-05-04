/// <reference path="./custom_matchers.d.ts"/>

import '../setup_test'
import {$P, $R, $S} from './kor'
import {calculateTransformFromVectors2, convertPointFromBoundingBox} from './util_math'
import {expectElem} from "../setup_test"

const PI = Math.PI
it('calculateTransformFromVectors2 simple', () => {
  const { move, rotate, scale }  = calculateTransformFromVectors2($P(2,2),
    [$P(2,4), $P(4,2)],
    [$P(0,8), $P(6,8)])!
  expect(rotate).toBeCloseTo(PI/4)
  expect(scale) .toBeCloseTo(6/Math.sqrt(8))
  expectElem(move).toBeEnumerableCloseTo($P(1,3).elements)
  expectElem($P(2,-2).rotate(rotate).scale(scale)).toBeEnumerableCloseTo([6,0])
})

it('calculateTransformFromVectors2 no d', () => {
  const { move, rotate, scale }  =calculateTransformFromVectors2($P(0,0),
    [$P(0,0), $P(10,0)],
    [$P(0,0), $P(0,20)])!
  expect(move)  .toEqual($P(0,0))
  expect(rotate).toBeCloseTo(PI/2)
  expect(scale) .toBeCloseTo(2)
})

it('convertPointFromBoundingBox works', () => {
  let p

  p = convertPointFromBoundingBox($P(200, 0), $R($P(0,0), $S(200, 200)),
    0.1, $S(1000, 1000)
  )
  expect(p.x).toBeCloseTo(990.03)
  expect(p.y).toBeCloseTo(-99.33)

  p = convertPointFromBoundingBox($P(200, 0), $R($P(0,0), $S(200, 200)),
    0.1, $S(100, 100))
  expect(p.x).toBeCloseTo(99.00)
  expect(p.y).toBeCloseTo(-9.93)

  p = convertPointFromBoundingBox($P(200, 0), $R($P(0,0), $S(200, 200)),
    0.1 + PI/2, $S(1000, 1000)
  )
  expect(p.x).toBeCloseTo(-99.33)
  expect(p.y).toBeCloseTo(9.966)

  p = convertPointFromBoundingBox($P(200, 0), $R($P(0,0), $S(200, 200)),
    0.1 + PI, $S(1000, 1000)
  )
  expect(p.x).toBeCloseTo(9.966)
  expect(p.y).toBeCloseTo(1099.33)

  p = convertPointFromBoundingBox($P(200, 0), $R($P(0,0), $S(200, 200)),
    0.1 + 1.5 * PI, $S(1000, 1000)
  )
  expect(p.x).toBeCloseTo(1099.33)
  expect(p.y).toBeCloseTo(990.03)
})
