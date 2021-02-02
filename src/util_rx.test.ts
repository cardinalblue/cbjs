import {
  cachedMapper,
  combineLatestWithChanges,
  combineLatestWithEmpty,
  enqueue,
  extend,
  filterInstanceOf,
  filterObservable,
  flattenArray,
  flattenObject,
  lastOrEmpty,
  pairFirst,
  progressCount,
  prolong,
  promise$,
  scan2,
  swapMap,
  takeDuring,
  tapScan,
  tapWithIndex,
  paginate$, taplog
} from "./util_rx"
import {concat, Observable, of, throwError} from "rxjs"
import {testScheduler} from "./setup_test"
import {catchError, map, mergeMap, share, switchMap, take, tap} from "rxjs/operators"
import {skip} from "rxjs/internal/operators/skip";

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

it(('takeDuring works'), () => {
  const scheduler = testScheduler()
  scheduler.run(helpers => {
    const {cold, expectObservable: ex} = helpers

    const a$ = cold("----a--b-----c----d-----e----f-")
    const c$ = cold("-----------m----n---|")
    ex(a$.pipe(takeDuring(c$)))
              .toBe("----a--b-----c----d-|")

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
it('combineLatestWithEmpty works', () => {
  const scheduler = testScheduler()
  scheduler.run( helpers => {
    const {cold, expectObservable: ex} = helpers

    ex(combineLatestWithEmpty([ cold('-a-b--'), cold('c-d---')]))
      .toBe('-nop--',
        {
          n: ['a', 'c'],
          o: ['a', 'd'],
          p: ['b', 'd']
        })

    ex(cold('---m--', {
      m: [],
    }).pipe(
      mergeMap(arr => combineLatestWithEmpty(arr))
    ))
      .toBe('---n--', {
        n: [],
      })
  })
})
it('combineLatestWithChanges works', () => {
  const scheduler = testScheduler()
  scheduler.run( helpers => {
    const {cold, expectObservable: ex} = helpers

    // @ts-ignore
    ex(combineLatestWithChanges<number>([])).toBe('(a|', {a: [[], []]})

    const a$ = cold('---a----c----e----g-----|')
    const b$ = cold('------b----d----f----h------|')
    ex(combineLatestWithChanges([a$, b$]))
      .toBe(        '------0-1--2-3--4-5--6------|', [
        [['a', 'b'], ['b']],
        [['c', 'b'], ['c']],
        [['c', 'd'], ['d']],
        [['e', 'd'], ['e']],
        [['e', 'f'], ['f']],
        [['g', 'f'], ['g']],
        [['g', 'h'], ['h']],
      ])
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

it('takes then terminates', () => {
  const scheduler = testScheduler()
  scheduler.run( helpers => {
    const {cold, expectObservable: ex} = helpers
    ex(cold('---a---b-----c---|')
      .pipe(take(1)))
      .toBe('---(a|')
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

it(('TESTING'), () => {
  const scheduler = testScheduler()
  scheduler.run(helpers => {
    const {cold, expectObservable: ex} = helpers

    const a$ = cold("-----a|")
    const b$ = cold("-----------m----n---|")
    ex(a$.pipe(
      mergeMap(_ => b$),

    ))
      .toBe(        "----------------m----n---|")
  })
})

it('tapWithIndex works', () => {
  const scheduler = testScheduler()
  scheduler.run(helpers => {
    const {cold, expectObservable: ex} = helpers

    const res: any[] = []
    of('a', 'b', 'c').pipe(
      tapWithIndex((t, index) => {
        res.push([t, index])
      })
    ).subscribe()

    expect(res).toStrictEqual([['a', 0], ['b', 1], ['c', 2]])
  })
})

it(('tapScan'), () => {
  const out: string[] = []

  const scheduler = testScheduler()
  scheduler.run(helpers => {
    const {cold, expectObservable: ex} = helpers

    const a$ = cold("--a--b-c---d-|")
    ex(a$.pipe(
        tapScan('=', (prev: string, t: string, i: number) => {
          const acc = prev + t + i
          out.push(acc)
          return acc
        })
    ))
        .toBe("--a--b-c---d-|")
  })

  expect(out).toStrictEqual([
    '=a0',
    '=a0b1',
    '=a0b1c2',
    '=a0b1c2d3',
  ])
})

it(('promise$ works'), () => {
  const scheduler = testScheduler()
  scheduler.run(helpers => {
    const {cold, expectObservable: ex} = helpers

    let n = 0
    expect(n).toBe(0)

    function p() {
      return new Promise((resolve, reject) => resolve(n++))
    }
    p()
    expect(n).toBe(1)

    promise$(() => p())
    expect(n).toBe(1)

    promise$(() => p()).subscribe()
    expect(n).toBe(2)

  })
})

it(('promise$ works sequence'), () => {
  const scheduler = testScheduler()
  scheduler.run(helpers => {
    const {cold, expectObservable: ex} = helpers

    ex(of(2)).toBe('(a|)', { a: 2 })

    // function p() {
    //   return new Promise((resolve, reject) => resolve(1))
    // }
    //
    // ex(promise$(() => p())).toBe('(a|)', { a: 1 })
  })
})

it(('catchError exploration'), () => {
  const scheduler = testScheduler()
  scheduler.run(helpers => {
    const {cold, expectObservable: ex} = helpers

    const o$ = throwError(new Error('error!')).pipe(
      map(s => s),
      tap(() => console.log("!!!!")),
      catchError(err => of(1)),
    )
    ex(o$).toBe('(a|)', {a: 1})

  })
})

it('filterInstanceOf works', () => {

  class X { constructor(readonly n: string) {} }
  class Y { constructor(readonly n: string) {} }
  class Z { constructor(readonly n: string) {} }


  const scheduler = testScheduler()
  scheduler.run(helpers => {
    const {cold, expectObservable: ex} = helpers

    const s = of(new X("a"), new Y("b"), new X("c"), new Y("d"))
    ex(s.pipe(
      filterInstanceOf(X),
      map(_ => _.n),
    )).toBe("(ac|)")

    ex(s.pipe(
      filterInstanceOf(Y),
      map(_ => _.n),
    )).toBe("(bd|)")

    ex(s.pipe(
      filterInstanceOf(Z),
      map(_ => _.n),
    )).toBe("(|)")

  })
})

it('swapMap works', () => {

  const scheduler = testScheduler()
  scheduler.run(helpers => {
    const {cold, expectObservable: ex} = helpers

    const s1 = cold('--a--b--c-|')
    const s2 = cold('----m----n-|')
    const e  = cold('--#')

    const s$ = cold('--a---b|', { a: s1, b: s2 })

    // ---- Output continues until output Observables finish
    ex(s$.pipe(mergeMap(i => i)))
      .toBe('----a--b--(cm)-n-|')

    // ==== switchMap

    // ---- Output continues until output Observables finish
    ex(s$.pipe(switchMap(i => i)))
      .toBe('----a-----m----n-|')

    // ---- Complete with empty completes everything
    ex(cold('----|').pipe(switchMap(i => i)))
      .toBe('----|')

    // ---- Error on inner errors everything
    ex(cold('-a---#', { a: s1 }).pipe(switchMap(i => i)))
      .toBe('---a-#')

    // ---- Error on outer errors everything
    ex(cold('--a-----e', { a: s1, e: e }).pipe(switchMap(i => i)))
      .toBe('----a--b--#')

    // ---- Error on outer errors everything
    ex(cold('--a-----------------b-|', { a: s1, b: s2 }).pipe(switchMap(i => i)))
      .toBe('----a--b--c-------------m----n-|')

    // ==== swapMap

    // ---- Output continues until output Observables finish
    ex(s$.pipe(swapMap(i => i)))
      .toBe('----a-----m----n-|')

    // ---- Complete with empty completes everything
    ex(cold('----|').pipe(swapMap(i => of(i))))
      .toBe('----|')

    // ---- Error on inner errors everything
    ex(cold('-a---#', { a: s1 }).pipe(swapMap(i => i)))
      .toBe('---a-#')

    // ---- Error on outer errors everything
    ex(cold('--a-----e', { a: s1, e: e }).pipe(swapMap(i => i)))
      .toBe('----a--b--#')

    // ---- Error on outer errors everything
    ex(cold('--a-----------------b-|', { a: s1, b: s2 }).pipe(swapMap(i => i)))
      .toBe('----a--b--c-------------m----n-|')
  })

})

it('flattenObject works', () => {
  const scheduler = testScheduler()
  scheduler.run(helpers => {
    const {cold, expectObservable: ex} = helpers

    ex(
      cold('a', { a: { k1: 1, k2: 2 }}).pipe(
        flattenObject(n => of(n * 10))
      )
    ).toBe('a', { a: { k1: 10, k2: 20 }})

  })
})

it('flattenArray works', () => {
  const scheduler = testScheduler()
  scheduler.run(helpers => {
    const {cold, expectObservable: ex} = helpers

    ex(
      cold('a', { a: [ 1, 2 ]}).pipe(
        flattenArray(n => of(n * 10))
      )
    ).toBe('a', { a: [ 10, 20 ]})

  })
})

it('flattenArray switching', () => {
  const scheduler = testScheduler()
  scheduler.run(helpers => {
    const {cold, expectObservable: ex} = helpers

    const $ = cold('---a-------b-------c', {
      a: [cold('m---n'), cold('o---p')],
      b: [cold('q---r')],
      c: [],
    })
    ex($.pipe(
      flattenArray<Observable<string>, string>(x => x)
    )).toBe(
      '---0---(12)3---4---5', [
        ["m", "o"],
        ["n", "o"],
        ["n", "p"],
        ["q"],
        ["r"],
        []
      ]
    )

  })
})

it('ProgressCounter works', () => {

  const scheduler = testScheduler()
  scheduler.run(helpers => {
    const {cold, expectObservable: ex} = helpers


    const s$ = cold('----a---------b----c----------', {
      a: cold('        ----|'),
      b: cold('                  --------|'),
      c: cold('                       --------|'),
    })
    ex(s$.pipe(progressCount())).toBe(
      '              0---1---0-----1----2--1----0',
      [0,1,2,3,4,5]
    )

  })
})

it('paginate$ works 1', () => {
  const scheduler = testScheduler()
  scheduler.run(helpers => {
    const {expectObservable: ex} = helpers

    const f$ = (cursor: number|null, n: number) => {
      const ret: [number, Array<number>] = cursor === null ?
        [1, [1]]
        : [
          cursor + 1,
          cursor < 3 ? [cursor + 1] : []
          ]
      return of(ret)
    }
    ex(paginate$(f$, 3))
      .toBe('(0123|)', [
        [],
        [1],
        [1,2],
        [1,2,3],
      ])

    ex(paginate$(f$, -1))
      .toBe('(0|)', [
        []
      ])
    ex(paginate$(f$, 100))
      .toBe('(0123|)', [
        [],
        [1],
        [1,2],
        [1,2,3],
      ])
  })
})

it('paginate$ works 2 (no infinite recursion on error handling)', () => {
  const scheduler = testScheduler()
  scheduler.run(helpers => {
    const {expectObservable: ex} = helpers

    const f$ = (cursor: number|null, n: number) =>
        cursor === null ?
          of([1, [1]] as [number, number[]]) :
          cursor < 2 ?
            of([cursor + 1, [cursor + 1]] as [number, number[]]) :
            throwError("no more data")
    ex(paginate$(f$, 100)).toBe('(0123|)', [
      [],
      [1],
      [1,2],
      [1,2,3],
    ])
  })
})
