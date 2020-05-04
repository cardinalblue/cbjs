import {BehaviorSubject, Observable, of} from "rxjs"
import {testScheduler} from "../setup_test"
import {added, arrayFilterMap, arrayMap, cachedArrayMapper, removed, sortingMap, undiff} from "./util_array_rx";
import {map} from "rxjs/operators"

class Output1 {
  s: string
  disposed = false
  constructor(s: string) { this.s = "out" + s; }
}
it('cachedArrayMapper works', () => {

  type INPUT = string
  const mapper = cachedArrayMapper(
      (s: INPUT) => { return "k" + s },
      (s: INPUT) => { return new Output1(s) },
      (o: Output1) => { o.disposed = true }
    )

  const o1 = mapper(["1"])
  expect(o1.length).toEqual(1)
  expect(o1[0].s).toEqual("out1")
  expect(o1[0].disposed).toBeFalsy()

  const o2 = mapper(["1"])
  expect(o1).toEqual(o2)
  expect(o1[0] === o2[0]).toEqual(true)
  expect(o2[0].disposed).toBeFalsy()

  const o3 = mapper(["1", "2"])
  expect(o1[0]).toEqual(o3[0])
  expect(o1[0] === o3[0]).toEqual(true)
  expect(o3[0].s).toEqual("out1")
  expect(o3[1].s).toEqual("out2")
  expect(o3[0].disposed).toBeFalsy()
  expect(o3[1].disposed).toBeFalsy()

  const o4 = mapper(["2"])
  expect(o3[1]).toEqual(o4[0])
  expect(o3[0].disposed).toBeTruthy()
  expect(o3[1].disposed).toBeFalsy()
})

it('arrayMap works simple level', () => {
  const scheduler = testScheduler()
  scheduler.run( helpers => {
    const {cold, expectObservable: ex} = helpers

    const sm = arrayMap((x: number) => of(x))

    ex(cold<number[]>('--|').pipe(sm))
      .toBe('--|')
    ex(cold('-a-|', { a: [1,3,2] }).pipe(sm))
      .toBe('-a-|', { a: [1,3,2] })
    ex(cold('-a---b--|', { a: [1,3,2], b: [6,5,4] }).pipe(sm))
      .toBe('-a---b--|', { a: [1,3,2], b: [6,5,4] })
    ex(cold('-a-c-b--|', { a: [1,3,2], c: [], b: [6,5,4] }).pipe(sm))
      .toBe('-a-c-b--|', { a: [1,3,2], c: [], b: [6,5,4] })
  })
})

it('arrayMap works changing values', () => {

  class X {
    i: Observable<number>
    constructor(i: number | Observable<number>) {
      this.i = (typeof i === 'number') ?
        new BehaviorSubject(i) : i
    }
  }

  const scheduler = testScheduler()
  scheduler.run( helpers => {
    const {cold, expectObservable: ex} = helpers

    const sm = arrayMap((x: X) => x.i)

    const x1 = new X(10)
    const x2 = new X(20)
    const x3 = new X(30)

    // Typescript bindings for `cold` are wrong, so have to patch
    function _cold<T>(marbles: string, values: T[]): Observable<T> {
      return cold(marbles, <{ [key: string]: T }>(values as any))
    }

    // ---- Simple
    ex(cold<X[]>('--|').pipe(sm))
      .toBe('--|')
    ex(cold('-----a---|', { a: [x2,x1,x3] }).pipe(sm))
      .toBe('-----a---|', { a: [20,10,30] })

    // ---- Changing values
    const x4 = new X(_cold('0----1---2------|', [5, 25, 15]))
    ex(_cold('--0--------------|', [ [x2,x1,x3,x4] ]).pipe(sm))
      .toBe('--0----1---2-----|', [ [20,10,30,5], [20,10,30,25], [20,10,30,15] ])
    ex(_cold('--0-------1------|', [ [x2,x1,x3,x4], [x3,x1] ]).pipe(sm))
      .toBe('--0----1--2------|', [ [20,10,30,5], [20,10,30,25], [30,10] ])

    // ---- With a delay in the sub value
    const x5 = new X(_cold('---0----1---2------|', [5, 25, 15]))
    ex(_cold('--0--------------|', [ [x2,x1,x3,x5] ]).pipe(sm))
      .toBe('-----0----1---2--|', [ [20,10,30,5], [20,10,30,25], [20,10,30,15] ])
    ex(_cold('--0---------1-------|', [ [x2,x1,x3,x5], [x3,x1] ]).pipe(sm))
      .toBe('-----0----1-2-------|', [ [20,10,30,5], [20,10,30,25], [30,10] ])

  })
})

// --------------------------------------------------------------

it('sortingMap works simple level', () => {
  const scheduler = testScheduler()
  scheduler.run( helpers => {
    const {cold, expectObservable: ex} = helpers

    const sm = sortingMap((x: number) => of(x))

    ex(cold<number[]>('--|').pipe(sm))
      .toBe('--|')
    ex(cold('-a-|', { a: [1,3,2] }).pipe(sm))
      .toBe('-a-|', { a: [1,2,3] })
    ex(cold('-a---b--|', { a: [1,3,2], b: [6,5,4] }).pipe(sm))
      .toBe('-a---b--|', { a: [1,2,3], b: [4,5,6] })
    ex(cold('-a-c-b--|', { a: [1,3,2], c: [], b: [6,5,4] }).pipe(sm))
      .toBe('-a-c-b--|', { a: [1,2,3], c: [], b: [4,5,6] })
  })
})

it('sortingMap works changing sort values', () => {

  class X {
    i: Observable<number>
    constructor(i: number | Observable<number>) {
      this.i = (typeof i === 'number') ?
        new BehaviorSubject(i) : i
    }
  }

  const scheduler = testScheduler()
  scheduler.run( helpers => {
    const {cold, expectObservable: ex} = helpers

    const sm = sortingMap((x: X) => x.i)

    const x1 = new X(10)
    const x2 = new X(20)
    const x3 = new X(30)

    // Typescript bindings for `cold` are wrong, so have to patch
    function _cold<T>(marbles: string, values: T[]): Observable<T> {
      return cold(marbles, <{ [key: string]: T }>(values as any))
    }

    // ---- Simple
    ex(cold<X[]>('--|').pipe(sm))
      .toBe('--|')
    ex(cold('-----a---|', { a: [x2,x1,x3] }).pipe(sm))
      .toBe('-----a---|', { a: [x1,x2,x3] })

    // ---- Changing sorting
    const x4 = new X(_cold('0----1---2------|', [5, 25, 15]))
    ex(_cold('--0--------------|', [ [x2,x1,x3,x4] ]).pipe(sm))
      .toBe('--0----1---2-----|', [ [x4,x1,x2,x3], [x1,x2,x4,x3], [x1,x4,x2,x3] ])
    ex(_cold('--0-------1------|', [ [x2,x1,x3,x4],                [x3,x1] ]).pipe(sm))
      .toBe('--0----1--2------|', [ [x4,x1,x2,x3], [x1,x2,x4,x3], [x1,x3] ])

    // With a delay in the sorting value
    const x5 = new X(_cold('---0----1---2------|', [5, 25, 15]))
    ex(_cold('--0--------------|', [ [x2,x1,x3,x5] ]).pipe(sm))
      .toBe('-----0----1---2--|', [ [x5,x1,x2,x3], [x1,x2,x5,x3], [x1,x5,x2,x3] ])
    ex(_cold('--0---------1-------|', [ [x2,x1,x3,x5],                [x3,x1] ]).pipe(sm))
      .toBe('-----0----1-2-------|', [ [x5,x1,x2,x3], [x1,x2,x5,x3], [x1,x3] ])

  })
})

it('cachedArrayMapper works', () => {

  type INPUT = string
  class Output {
    s: string
    constructor(s: string) { this.s = "out" + s; }
  }
  const mapper = cachedArrayMapper((s: INPUT) => { return "k" + s },
    (s: INPUT) => { return new Output(s) })
  const o1 = mapper(["1"])
  expect(o1.length).toEqual(1)
  expect(o1[0].s).toEqual("out1")
  const o2 = mapper(["1"])
  expect(o1).toEqual(o2)
  expect(o1[0] === o2[0]).toEqual(true)
  const o3 = mapper(["1", "2"])
  expect(o1[0]).toEqual(o3[0])
  expect(o1[0] === o3[0]).toEqual(true)
  expect(o3[0].s).toEqual("out1")
  expect(o3[1].s).toEqual("out2")
})

it('sortingMap works simple level', () => {
  const scheduler = testScheduler()
  scheduler.run( helpers => {
    const {cold, expectObservable: ex} = helpers
    const sm = sortingMap((x: number) => of(x))
    ex(cold<number[]>('--|').pipe(sm))
      .toBe('--|')
    ex(cold('-a-|', { a: [1,3,2] }).pipe(sm))
      .toBe('-a-|', { a: [1,2,3] })
    ex(cold('-a---b--|', { a: [1,3,2], b: [6,5,4] }).pipe(sm))
      .toBe('-a---b--|', { a: [1,2,3], b: [4,5,6] })
    ex(cold('-a-c-b--|', { a: [1,3,2], c: [], b: [6,5,4] }).pipe(sm))
      .toBe('-a-c-b--|', { a: [1,2,3], c: [], b: [4,5,6] })
  })
})
class X {
  i: Observable<number>
  constructor(i: number | Observable<number>) {
    this.i = (typeof i === 'number') ?
      new BehaviorSubject(i) : i
  }
}
it('sortingMap works changing sort values', () => {
  const scheduler = testScheduler()
  scheduler.run( helpers => {
    const {cold, expectObservable: ex} = helpers
    const sm = sortingMap((x: X) => x.i)
    const x1 = new X(10)
    const x2 = new X(20)
    const x3 = new X(30)
    // Typescript bindings for `cold` are wrong, so have to patch
    function _cold<T>(marbles: string, values: T[]): Observable<T> {
      return cold(marbles, <{ [key: string]: T }>(values as any))
    }

    // ---- Simple
    ex(cold<X[]>('--|').pipe(sm))
      .toBe('--|')
    ex(cold('-----a---|', { a: [x2,x1,x3] }).pipe(sm))
      .toBe('-----a---|', { a: [x1,x2,x3] })
    // ---- Changing sorting
    const x4 = new X(_cold('0----1---2------|', [5, 25, 15]))
    ex(_cold('--0--------------|', [ [x2,x1,x3,x4] ]).pipe(sm))
      .toBe('--0----1---2-----|', [ [x4,x1,x2,x3], [x1,x2,x4,x3], [x1,x4,x2,x3] ])
    ex(_cold('--0-------1------|', [ [x2,x1,x3,x4],                [x3,x1] ]).pipe(sm))
      .toBe('--0----1--2------|', [ [x4,x1,x2,x3], [x1,x2,x4,x3], [x1,x3] ])
    // With a delay in the sorting value
    const x5 = new X(_cold('---0----1---2------|', [5, 25, 15]))
    ex(_cold('--0--------------|', [ [x2,x1,x3,x5] ]).pipe(sm))
      .toBe('-----0----1---2--|', [ [x5,x1,x2,x3], [x1,x2,x5,x3], [x1,x5,x2,x3] ])
    ex(_cold('--0---------1-------|', [ [x2,x1,x3,x5],                [x3,x1] ]).pipe(sm))
      .toBe('-----0----1-2-------|', [ [x5,x1,x2,x3], [x1,x2,x5,x3], [x1,x3] ])
  })
})
it('removed works', () => {
  const scheduler = testScheduler()
  scheduler.run( helpers => {
    const {cold, expectObservable: ex} = helpers
    // Typescript bindings for `cold` are wrong, so have to patch
    function _cold<T>(marbles: string, values: T[]): Observable<T> {
      return cold(marbles, <{ [key: string]: T }>(values as any))
    }

    ex(_cold('01234567|', [
      [1,2,3],
      [2],
      [],
      [2,2,7],
      [7,8,8],
      [10,11,7],
      [4,11],
      [4,4,4,5],
    ])
      .pipe(removed()))
      .toBe('-0123456|', [
        [1,3],
        [2],
        [],
        [2,2],
        [8,8],
        [10,7],
        [11],
      ])

  })
})

it('added works', () => {
  const scheduler = testScheduler()
  scheduler.run( helpers => {
    const {cold, expectObservable: ex} = helpers
    const values = {
      a: [],
      b: [],
      c: [1,2],
      d: [2,3],
      e: [3,2],
      f: [2,4,5],
      g: [4,6],
      h: [6]
    }
    ex(cold('--a--b--c--d--e--f--g--h--|', values).pipe(added()))
      .toBe('-----b--c--d--e--f--g--h--|', {
        b: [],
        c: [1,2],
        d: [3],
        e: [],
        f: [4,5],
        g: [6],
        h: [],
      })
  })
})


it('undiff works', () => {
  const scheduler = testScheduler()
  scheduler.run( helpers => {
    const {cold, expectObservable: ex} = helpers
    const values = {
      a: ['a'],
      b: ['b'],
      c: ['c'],
      d: ['d'],
      e: ['e'],
      f: ['f'],
      g: ['g'],
      h: ['h'],
    }
    const added$   = cold('---a------b--c-----e--fg--------|', values)
    const removed$ = cold('-------a-------c----------f---|', values)
    ex(undiff<string>(added$, removed$, ['z']))
      .toBe(              '---0---1--2--3-4---5--67--8-----|', [
        ['z', 'a'],
        ['z'],
        ['z', 'b'],
        ['z', 'b', 'c'],
        ['z', 'b'],
        ['z', 'b', 'e'],
        ['z', 'b', 'e', 'f'],
        ['z', 'b', 'e', 'f', 'g'],
        ['z', 'b', 'e', 'g'],
      ])
  })
})

it('arrayFilterMap works changing values', () => {

  class X {
    i: Observable<number>
    constructor(i: number | Observable<number>) {
      this.i = (typeof i === 'number') ?
          new BehaviorSubject(i) : i
    }
  }

  const scheduler = testScheduler()
  scheduler.run( helpers => {
    const {cold, expectObservable: ex} = helpers

    const fm = arrayFilterMap((x: X) =>
        x.i.pipe(
          map(i => i % 2 === 0)
        )
    )

    const x1 = new X(10)
    const x2 = new X(20)
    const x3 = new X(30)

    // Typescript bindings for `cold` are wrong, so have to patch
    function _cold<T>(marbles: string, values: T[]): Observable<T> {
      return cold(marbles, <{ [key: string]: T }>(values as any))
    }

    // ---- Simple
    ex(_cold<X[]>('--|', []).pipe(fm))
      .toBe(      '--|')
    ex(cold('-----a---|', { a: [x2,x1,x3] }).pipe(fm))
      .toBe('-----a---|', { a: [x2,x1,x3] })

    // ---- Changing values
    const x4 = new X(_cold('0----1---2------|', [5, 40, 15]))
    ex(cold('--a--------------|', { a: [x2,x1,x4,x3] }).pipe(fm))
      .toBe('--a----b---c-----|', { a: [x2,x1,x3], b: [x2,x1,x4,x3], c: [x2,x1,x3]})
    ex(cold('--a-------b------|', { a: [x4,x2,x1,x3], b: [x3,x1] }).pipe(fm))
      .toBe('--a----b--c------|', { a: [x2,x1,x3], b: [x4,x2,x1,x3], c: [x3,x1] })
  })
})