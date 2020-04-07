import {finalize, tap} from "rxjs/operators"
import {Observable} from "rxjs"
import * as _ from "lodash"
import {doOnSubscribe} from "./util_rx"

export const BLANK = ""

// ----------------------------------------------------------------------------
// Debugging

export function taplog<X>(label: string, ...vars: any[])
  : (s: Observable<X>) => Observable<X> {
  return (s: Observable<X>) => s.pipe(
    tap(x => console.log(label, x, ...vars))
  )
}

export function log$<T>(s: string, ...vars: any[]) {
  return (source: Observable<T>) => source.pipe(
      doOnSubscribe(() => console.log(s, "subscribe", ...vars)),
      finalize(     () => console.log(s, "finalize", ...vars)),
      tap(() => {}, error => console.error(s, error, ...vars)),
      taplog(s, ...vars),
  )
}

export function LOG<X>(s: string, x: X, ...args: any[]) {
  console.log(s, x, ...args)
  return x
}
export function LOGTHRU<X>(...vars: any[]): X {
  var f = null
  if (vars.length > 0) {
    f = vars.pop()
  }
  console.log(...vars)
  if (f && typeof f === 'function') { return f(); }
  return f
}

// ----------------------------------------------------------------------------
// Useful types

export interface Elementable<T> {
  elements: Array<T>
}

// ----------------------------------------------------------------------------
// Object/Map

export function subkeys<T>(target: T, ...keys: Array<keyof T>) {
  return keys.reduce((out, k) => ({ ...out, [k]: target[k] }), {})
}


export function filterObject<T, M>(map: M, f: (v: any) => boolean = (b) => !!b)
  : M
{
  const ret:M = {} as M
  for (const k in map) {
    if (f(map[k]))
      ret[k] = map[k]
  }
  return ret
}

// ----------------------------------------------------------------------------
// Enumerable/Array

export function compact<T>(source: Array<T|null|undefined>): Array<T>
{
  return _.filter(source,
    (x: T|null|undefined) => x !== null && x !== undefined
  ) as Array<T>
}


export function withoutFirst<T>(a: Array<T>, t: T) {
  const x = _.findIndex(a, i => _.isEqual(i, t))
  if (x < 0) return a
  const r = [...a]
  r.splice(x, 1)
  return r
}

export function filterTruthy<T>(a: ArrayLike<T|null|undefined>): Array<T> {
  return Array.from(a).filter(t => !!t) as Array<T>
}

export function arrayRemove<T>(array: T[], f: (t: T) => boolean) {
  const index = array.findIndex(f)
  if (index >= 0) {
    array.splice(index, 1)
  }
  return array
}

export function isEmpty<T>(array: T[]) {
  return array.length == 0
}

export function last<T>(a: T[]): T|null {
  if (a.length <= 0) return null
  return a[a.length - 1]
}

export function next<T>(array: T[], target: T): T|null {
  const i = array.findIndex(t => target === t)
  if (i < 0 || i >= array.length) return null
  return array[i+1]
}

type Constructor = new (args: any) => any
export function findInstanceOf<A, T extends Constructor>(a: Array<A>, type: T): InstanceType<T>|undefined {
  for (let i of a) {
    if (i instanceof type)
      return i as InstanceType<T>
  }
  return undefined
}

export function includedOrDefault<T, D>(t: T, ts: Array<T>, _default: D): T | D {
  if (ts.find(x => x === t)) return t
  return _default
}

// ----------------------------------------------------------------------------
// Map/Object

export function mapmap<T, R>(map: {[k: string]: T}, f: ((t: T) => R))
  : {[k: string]: R}
{
  const ret:{[k: string]: R} = {}
  for (const k in map) {
    ret[k] = f(map[k])
  }
  return ret
}

// ----------------------------------------------------------------------------
// Functional

export function iff<A,B>(a: A|undefined|null, f: ((a: A) => B)): B|null {
  if (!!a) return f(a)
  return null
}

export function apply<T>(t: T, f: (t: T) => any) {
  f(t).bind(t)
  return t
}
export function wiht<T,R>(input: T, f: (t: T) => R): R {
  return f(input)
}
export function alos<T>(input: T, f: (t: T) => any): T {
  f(input)
  return input
}

// ----------------------------------------------------------------------------
// String

export function trim2(s: string): string {
  return s.replace(/^[\s\0]+/, "")
          .replace(/[\s\0]+$/, "")

}
export function insertAt(s1: string, index: number, s2: string) {
  return s1.substr(0, index) + s2 + s1.substr(index)
}

// ----------------------------------------------------------------------------
// Math
// https://stackoverflow.com/a/44996682/304734

export type ID = string
export function generateId(): ID {
  return Math.random().toString(36).substring(2)  +
    (new Date()).getTime().toString(36)
}

export function rand(i: number) {
  return Math.floor(Math.random() * i)
}

export function ifNumber(x: any, or: number) {
  if (_.isNumber(x)) return x
  else return or
}

export function now() {
  return (new Date()).getTime()
}

// ----------------------------------------------------------------------------
// DOM/React related

export function isFocused(dom: HTMLElement): boolean {
  if (document.activeElement) {
    return (document.activeElement === dom)
  }
  return false
}

// ----------------------------------------------------------------------------
// Queue

type QueueSubscriber<T> = (t: T) => void
export class Queue<T> {
  q: Array<T> = []
  subscribers: Array<QueueSubscriber<T>> = []

  subscribe(subscriber: QueueSubscriber<T>): () => void {
    this.subscribers.push(subscriber)
    this.resolve()
    return () => {
      arrayRemove(this.subscribers, i => i === subscriber)
    }
  }
  push(t: T) {
    this.q.push(t)
    this.resolve()
  }
  resolve() {
    this.q.forEach(t =>
      this.subscribers.forEach(s => s(t))
    )
    this.q = []
  }

}

// =======================================================================

export class Range {
  constructor(readonly index: number, readonly length: number) {}
}

// =======================================================================

export function typeCheck<T>(value: any,
                             type: "undefined"|"boolean"|"number"|"bigint"|"string"|"symbol"|"function"|"object",
                             _default: T): T
{
  if (typeof value === type)
    return value
  return _default
}

// =======================================================================

export function toMap<A,K>(source: A[], f: (a: A) => K)
  : Map<K,A> {
  const pairs = source.map(a => ([f(a), a])) as [K, A][]
  return new Map(pairs)
}




