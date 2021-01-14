import './setup_test'
import {$P, normalizeRotation, Point, Size} from './kor'

const PI = Math.PI
it('creates Points', () => {
  expect(Point.ZERO.x).toEqual(0)
  expect(Point.ZERO.y).toEqual(0)
  const p = new Point(1,2)
  expect(p.x).toEqual(1)
  expect(p.y).toEqual(2)
})
it('can operate on Points', () => {
  expect($P(1,2).add(     $P(3,5))).toEqual($P(4,7))
  expect($P(5,8).subtract($P(1,2))).toEqual($P(4,6))
})
it('creates Sizes', () => {
  expect(Size.ZERO.width).toEqual(0)
  expect(Size.ZERO.height).toEqual(0)
  expect(new Size(100, 200).width).toEqual(100)
  expect(new Size(100, 200).height).toEqual(200)
})
it('calculates angleTo', () => {
  expect($P(1,0).angleTo($P(0,1))).toBeCloseTo(+PI/2)
  expect($P(0,1).angleTo($P(1,0))).toBeCloseTo(-PI/2)
  expect($P(1,1).angleTo($P(1,0))).toBeCloseTo(-PI/4)
  expect($P(1,1).angleTo($P(0,1))).toBeCloseTo(+PI/4)
  expect($P(1,1).angleTo($P(-1,0))).toBeCloseTo(+3*PI/4)
})
it('normalizesRotation works', () => {
  expect(normalizeRotation(-PI/2)).toBeCloseTo(1.5*PI)
  expect(normalizeRotation(5*PI)).toBeCloseTo(PI)
  expect(normalizeRotation(-4.5*PI)).toBeCloseTo(1.5*PI)
})
