import * as _ from "lodash"

export const BLANK = ""

// ----------------------------------------------------------------------------
// Debugging

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

export function isDefined<T>(t: T|undefined): t is T {
  return t !== undefined
}

// ---- Copied from https://fettblog.eu/typescript-hasownproperty/
//
export function hasProperty<Y extends PropertyKey>(obj: unknown, prop: Y)
  : obj is Object & Record<Y, unknown>
{
  return (obj instanceof Object) && obj.hasOwnProperty(prop)
}

export function safeProperty<Y extends PropertyKey>(obj: unknown, prop: Y)
  : unknown
{
  return hasProperty(obj, prop) && obj[prop]
}

export function safeGet<Y extends PropertyKey>(obj: unknown, prop: Y, f: (obj: unknown) => unknown)
  : unknown
{
  return f(safeProperty(obj, prop))
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

export type Constructable<T=any> = new (...args: any[]) => T

export function findInstanceOf<A, T extends Constructable>(a: Array<A>, type: T)
  : InstanceType<T>|undefined
{
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

export function filterInstances<TOUT extends Constructable, TIN=any>(
  array: TIN[],
  klass: TOUT
)
{
  return array.filter(x => x instanceof klass) as any as Array<InstanceType<TOUT>>
}

export type TYPER<T, C extends T> = (t: T) => t is C
export function filterType<T, C extends T>(ts: T[], f: TYPER<T, C>): C[] {
  return ts.filter(f) as C[]
}

export function objectToArray<T>(obj: { [k: string]: T }): Array<[string, T]> {
  return Object.keys(obj).map(key => [key, obj[key]]);
}
export function objectFromArray<V>(array: Array<[string, V]>): { [s: string]: V } {
  return array.reduce<{ [k: string]: V }>((obj, [k, v]) => {
    obj[k] = v
    return obj
  }, {});
}

export function keys<T>(t: T): (keyof T)[] {
  return Object.keys(t) as (keyof T)[]
}

/**
 * Finds all max values in `arr` using `compareF`.
 */
export function allMaxBy<T>(arr: T[],
                            compareF: (a: T, b: T) => number)
  : T[]
{
  if (!arr.length) return []

  let max = arr[0], maxes = [arr[0]]
  for (let i = 1; i < arr.length; i++) {
    const compare = compareF(max, arr[i])
    if (compare < 0) {
      max = arr[i]
      maxes = [max]
    }
    else if (compare === 0) {
      maxes.push(arr[i])
    }
  }

  return maxes
}

/**
 * Finds the max value in `arr` using `compareF`.
 */
export function maxBy<T>(arr: T[],
                         compareF: (a: T, b: T) => number)
  : T|undefined
{
  if (!arr.length) return undefined

  let max = arr[0]
  for (let i = 1; i < arr.length; i++) {
    const compare = compareF(max, arr[i])
    if (compare < 0)
      max = arr[i]
  }

  return max
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

export function mapMap<K,V,R>(map: Map<K,V>, f: (k: K, v: V) => R)
  : Map<K,R>
{
  return new Map(
    [...map].map(([k, v]) => [k, f(k, v)])
  )
}

export function mapFilter<K,V>(map: Map<K,V>, f: (k: K, v: V) => boolean)
  : Map<K,V>
{
  return new Map(
    [...map].filter(([k, v]) => f(k, v))
  )
}

export function mapMerge<K,V>(...maps: Array<Map<K,V>>)
  : Map<K,V>
{
  return new Map(
    _.flatMap(maps, m => [...m])
  )
}

// export function MAP(object: Object) {
//
//   return new Map(Object.entries(object))
// }

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
export function clone<T extends object>(t: T, mod: Partial<T> = {}): T {
  return Object.assign(Object.create(t), mod)
}
export function copyF<F extends Function>(f: F): F {
  return f.bind({})
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
  : Map<K,A>
{
  const pairs = source.map(a => ([f(a), a])) as [K, A][]
  return new Map(pairs)
}




