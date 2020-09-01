import {Elementable} from "./util"
import * as _ from "lodash"

export function $P(x: number, y: number) { return new Point(x, y); }

export class Point implements Elementable<number>{
  get elements(): number[] { return [this.x, this.y]; }

  static ZERO = new Point(0, 0)
  static HALF = new Point(0.5, 0.5)
  static ONEX = new Point(1, 0)
  static ONEY = new Point(0, 1)

  // ---- Construction
  // eslint-disable-next-line no-useless-constructor
  constructor(readonly x: number, readonly y: number) {

  }
  toString(): string {
    return `Point(${this.x}, ${this.y})`
  }
  isEqual(p: Point) {
    return _.isEqual(this.x, p.x) &&
           _.isEqual(this.y, p.y)
  }
  add(other: Point|Size) {
    return new Point(this.x + other.x, this.y + other.y)
  }
  subtract(other: Point|Size) {
    return new Point(this.x - other.x, this.y - other.y)
  }
  angleTo(p2: Point): number {
    const p1 = this
    const a1 = -Math.atan2(-p1.y, p1.x)
    const a2 = -Math.atan2(-p2.y, p2.x)
    return (a2 - a1)
  }
  magnitude2() {
    return this.x * this.x + this.y * this.y
  }
  magnitude() {
    return Math.sqrt(this.magnitude2())
  }
  toSize() {
    return new Size(this.x, this.y)
  }
  scale(scale: number|Point, scale2?: number) {
    if (scale instanceof Point)
      return new Point(this.x * scale.x, this.y * scale.y)
    return new Point(
      this.x * scale,
      this.y * (
        typeof scale2 === 'undefined' ? scale : scale2
      )
    )
  }
  rotate(angle: number) {
    return  new Point(
      this.x * Math.cos(angle) - this.y * Math.sin(angle),
      this.x * Math.sin(angle) + this.y * Math.cos(angle)
    )

  }
  normalized() {
    return this.scale(1/this.magnitude())
  }
  normalizeTo(x: number, y: number) {
    return new Point(this.x / x, this.y / y)
  }
  dot(other: Point): number {
    return this.x * other.x + this.y * other.y
  }
  static centroid(...points: Point[]): Point {
    return new Point(
      points.reduce((t, p) => t + p.x, 0) / points.length,
      points.reduce((t, p) => t + p.y, 0) / points.length
    )
  }
  static distance(p0: Point, p1: Point) {
    return Math.sqrt(
      Math.pow(p0.x - p1.x, 2) +
      Math.pow(p0.y - p1.y, 2)
    )
  }
}

export class Vector {
  // eslint-disable-next-line no-useless-constructor
  constructor(readonly p1: Point, readonly p2: Point) {
  }
  toPoint(): Point { return this.p2.subtract(this.p1) }
  angleTo(other: Vector): number {
    const vn1 = this.toPoint()
    const vn2 = other.toPoint()
    return (Math.atan2(vn2.y, vn2.x) - Math.atan2(vn1.y, vn1.x))
  }
  scaleTo(other: Vector): number {
    return Math.sqrt(
      other.toPoint().magnitude2() /
      this.toPoint().magnitude2()
    )
  }
}

export function $S(width: number, height: number) { return new Size(width, height); }
export class Size extends Point {
  static ZERO = new Size(0, 0)
  static ONE  = new Size(1, 1)

  get width()  { return this.x; }
  get height() { return this.y; }

  toString(): string {
    return `Size(${this.width}, ${this.height})`
  }
  isEqual(other: Size): boolean {
    return this.width === other.width && this.height === other.height
  }

  // Operations
  scale(scale: number, scale2?: number): Size {
    return new Size(
      this.width * scale,
      this.height * (
        typeof scale2 === 'undefined' ? scale : scale2
      )
    )
  }
  toPoint(): Point {
    return new Point(this.width, this.height)
  }
  center(): Point {
    return new Point(this.x/2, this.y/2)
  }
}

export class Rect {
  static ONE  = new Rect(Point.ZERO, Size.ONE)
  static ZERO = new Rect(Point.ZERO, Size.ZERO)

  // eslint-disable-next-line no-useless-constructor
  constructor(readonly origin: Point, readonly size: Size) {
  }

  // Getters
  get top()    { return this.origin.y; }
  get left()   { return this.origin.x; }
  get width()  { return this.size.width; }
  get height() { return this.size.height; }
  get center() { return $P(this.origin.x + this.size.width/2,
    this.origin.y + this.size.height/2); }

  // Operations
  offset(p: Point) {
    return new Rect(this.origin.add(p), this.size)
  }
  contains(p: Point) {
    return (p.x >= this.origin.x &&
      p.x < (this.origin.x + this.size.width) &&
      p.y >= this.origin.y &&
      p.y < (this.origin.y + this.size.height))
  }
}

export function $R(origin: Point, size: Size) { return new Rect(origin, size); }

export function normalizeRotation(rotation: number): number {
  const PI2 = Math.PI * 2
  return (rotation % PI2 + PI2) % PI2
}
