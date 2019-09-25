import {
  arrayMap,
  cachedMapper,
  cachedMapperArray, enqueue, extend,
  filterObservable,
  lastOrEmpty,
  pairFirst, prolong, removed,
  scan2,
  sortingMap, undiff
} from "./util_rx"
import {BehaviorSubject, concat, Observable, of} from "rxjs"
import {testScheduler} from "./setup_test"
import {map, mergeMap, share, take} from "rxjs/operators"

it('lastOrEmpty works', () => {
  const scheduler = testScheduler()
  scheduler.run( helpers => {
    const {cold, expectObservable: ex} = helpers

    ex(cold('--a---').pipe(lastOrEmpty())) .toBe('------')
    ex(cold('--a---|').pipe(lastOrEmpty())).toBe('------(a|')
    ex(cold('------|').pipe(lastOrEmpty())).toBe('------|')
  })
})

class Output2 {
  s: string
  constructor(s: string) { this.s = "out" + s; }
}
it('cachedMapper works', () => {

  const m = cachedMapper(
    (s: string) => { return "k" + s },
    (s: string) => {
      return new Output2(s)
    }
  )

  const o1 = m("1")
  const o2 = m("1")
  expect(o1).toEqual(o2)
  expect(o1 === o2).toEqual(true)

  const o3 = m("2")
  expect(o3.s).toEqual("out2")

})

class Output1 {
  s: string
  constructor(s: string) { this.s = "out" + s; }
}
it('cachedMapperArray works', () => {

  type INPUT = string
  const mapper = cachedMapperArray((s: INPUT) => { return "k" + s },
    (s: INPUT) => { return new Output1(s) })

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

it('scan2 works', () => {
  const scheduler = testScheduler()
  scheduler.run( helpers => {
    const {cold, expectObservable: ex} = helpers

    // Typescript bindings for `cold` are wrong, so have to patch
    function _cold<T>(marbles: string, values: T[]): Observable<T> {
      return cold(marbles, <{ [key: string]: T }>(values as any))
    }

    const values = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]
    ex(_cold('--1---2----1---2--', values).pipe(
      scan2("foo", (acc: number|"foo", i: number) =>
        acc === "foo" ? 2 + i : acc + i
        )
    )).toBe('--3---5----6---8--', values)

    ex(_cold('--1---2----1---2----1--', values).pipe(
      scan2("foo", (acc: number|"foo", i: number) =>
        acc === "foo" ? 2 + i : acc + i
      )
    )).toBe('--3---5----6---8----9--', values)

  })
})

it('how share works', () => {
  const scheduler = testScheduler()
  scheduler.run( helpers => {
    const {cold, expectObservable: ex} = helpers

    // Typescript bindings for `cold` are wrong, so have to patch
    function _cold<T>(marbles: string, values: T[]): Observable<T> {
      return cold(marbles, <{ [key: string]: T }>(values as any))
    }

    const values = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]

    const hot = _cold('--1---2----1---2--', values).pipe(share())
    ex(hot).toBe('--1---2----1---2--', values)
    ex(hot).toBe('--1---2----1---2--', values)

    const obs = new Observable<number>(subscriber => {
      subscriber.next(10)
      subscriber.next(20)
      subscriber.next(30)
      subscriber.next(40)
    })
    const shared = obs.pipe(share())
    ex(shared).toBe('(0123)', [10,20,30,40])
    ex(shared).toBe('', [10,20,30,40])

  })
})

it(('filterObservable works'), () => {
  const scheduler = testScheduler()
  scheduler.run(helpers => {
    const {cold, expectObservable: ex} = helpers
    const predicate = (subs: Observable<string>) => subs.pipe(
      map((s) => (s.charCodeAt(0) % 2) === 0),
      take(1)
    )
    ex(cold("m-n--o-p-qrs", {
        m: cold("a-b-c-d-e"),
        n: cold("-f-g-h"),
        o: cold("--b-c-d"),
        p: cold("-g-h"),
        q: cold("-|"),
        r: cold("|"),
        s: cold("----h-i-j")  // Check even if predicate no output will pass next
      })
        .pipe(
          filterObservable(predicate),
          mergeMap(_ => _)
        )
    )
      .toBe("----f-g-hb-c-d-----h-i-j")
  })
})
it('pairFirst works', () => {
  const scheduler = testScheduler()
  scheduler.run( helpers => {
    const {cold, expectObservable: ex} = helpers
    ex(cold('--').pipe(pairFirst()))
      .toBe('---')
    ex(cold('-a-').pipe(pairFirst()))
      .toBe('---')
    ex(cold('--a-b---c--d').pipe(pairFirst()))
      .toBe('----m---n--o', {m: ['a', 'b'], n: ['a', 'c'], o: ['a', 'd']})
  })
})
it('cachedMapper works', () => {

  class Output {
    s: string
    constructor(s: string) { this.s = "out" + s; }
  }
  const m = cachedMapper(
    (s: string) => { return "k" + s },
    (s: string) => {
      console.log(">>>> new Output")
      return new Output(s)
    }
  )
  const o1 = m("1")
  const o2 = m("1")
  expect(o1).toEqual(o2)
  expect(o1 === o2).toEqual(true)
  const o3 = m("2")
  expect(o3.s).toEqual("out2")
})
it('cachedMapperArray works', () => {

  type INPUT = string
  class Output {
    s: string
    constructor(s: string) { this.s = "out" + s; }
  }
  const mapper = cachedMapperArray((s: INPUT) => { return "k" + s },
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
it('extend works', () => {

  const scheduler = testScheduler()
  scheduler.run( helpers => {
    const { cold, expectObservable: ex } = helpers
    ex(concat(cold('-a--|'), cold('---b-|')))
      .toBe('-a-----b-|')
    ex(concat(cold('---|'), cold('----|')))
      .toBe('-------|')
    // Simple extend
    ex(cold('a--b--|').pipe(extend(2, scheduler)))
      .toBe('a--b----|')
    ex(cold('a--b--|').pipe(extend(4, scheduler)))
      .toBe('a--b------|')
    ex(cold('----|').pipe(extend(4, scheduler)))
      .toBe('--------|')
    ex(cold('|').pipe(extend(3, scheduler)))
      .toBe('---|')
  })
})
it('enqueue works', () => {

  const scheduler = testScheduler()
  scheduler.run( helpers => {
    const { cold, expectObservable: ex } = helpers
    const q = enqueue((x: number) => x, scheduler)
    ex(cold('-|',         { a: 1 }).pipe(q))
      .toBe('-|',         { a: 1 })
    ex(cold('a-|',        { a: 1 }).pipe(q))
      .toBe('a-|',        { a: 1 })
    ex(cold('d---|',      { d: 4 }).pipe(q))
      .toBe('d---|',      { d: 4 })
    ex(cold('d--|',       { d: 4 }).pipe(q))
      .toBe('d---|',      { d: 4 })
    ex(cold('e--|',       { e: 6 }).pipe(q))
      .toBe('e-----|',    { e: 6 })
    ex(cold('e--c|',      { e: 6, c: 3 }).pipe(q))
      .toBe('e-----c--|', { e: 6, c: 3 })
    ex(cold('b-----c|',   { b: 2, c: 3 }).pipe(q))
      .toBe('b-----c--|', { b: 2, c: 3 })
  })
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
it('takes then terminates', () => {
  const scheduler = testScheduler()
  scheduler.run( helpers => {
    const {cold, expectObservable: ex} = helpers
    ex(cold('---a---b-----c---|')
      .pipe(take(1)))
      .toBe('---(a|')
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
it('prolong works', () => {
  const scheduler = testScheduler()
  scheduler.run( helpers => {
    const {cold, expectObservable: ex} = helpers
    ex(cold('-----a--------b---c--|')
      .pipe(prolong(5, scheduler)))
      .toBe('-----0----1---2---34---5--|', [
        ['a'],
        [],
        ['b'],
        ['b', 'c'],
        ['c'],
        []
      ])

  })
})