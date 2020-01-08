import {
  cachedMapper,
  enqueue, extend,
  filterObservable,
  lastOrEmpty,
  pairFirst, prolong, promise$, scan2,
  takeDuring, tapScan, tapWithIndex
} from "./util_rx"
import {concat, from, Observable, of} from "rxjs"
import {testScheduler} from "./setup_test"
import {delay, flatMap, map, mergeMap, share, take} from "rxjs/operators"
import {tap$} from "./util"

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
      flatMap(_ => b$),

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