import {allMaxBy, arrayRemove, clone, filterTruthy, filterType, insertAt, mapmap, maxBy, toMap, typeCheck} from "./util"

it('mapmap works', () => {
  expect(mapmap({ a: 2, b: 3 }, v => v + 1)).toEqual({ a: 3, b: 4})

})

it('arrayRemove works', () => {
  const a = [10,20,30,40]
  arrayRemove(a, x => x === 20)
  expect(a).toEqual([10,30,40])
})

it ('insertAt works', () => {
  expect(insertAt("abcdef", 0, "FOO")).toBe("FOOabcdef")
  expect(insertAt("abcdef", 1, "FOO")).toBe("aFOObcdef")
  expect(insertAt("", 3, "FOO")).toBe("FOO")
  expect(insertAt("", 300, "FOO")).toBe("FOO")
})

it ('typeCheck works', () => {
  expect(typeCheck(10, "number", 3)).toBe(10)
  expect(typeCheck("10", "number", 3)).toBe(3)
  expect(typeCheck("10", "number", null)).toBe(null)
})

it ('toMap works', () => {
  expect(toMap(['a', 'bc', 'def'], s => s.length))
    .toEqual(new Map([[1, 'a'], [2, 'bc'], [3, 'def']]))
})

it ('filterTruthy', () => {
  expect(filterTruthy([ 1, null, 2, 3, 4 ]))
    .toEqual([1,2,3,4])
})

it ('filterType works', () => {

  const a: number[] =
    filterType<any, number>([1, "22", 3, "444"],
        i => typeof i === 'number')
  expect(a).toEqual([1, 3])

})

it("allMaxBy works", () => {

  let arr = [0, 1, 2, 3, 5, 5, 5, 5, 5, 5, 5, 2, 3, 5, 4, 3, -1]
  let max = allMaxBy(
    arr,
    (a, b) => a-b
  )
  expect(max).toEqual(expect.arrayContaining([5, 5, 5, 5, 5, 5, 5, 5]))
  expect(max.length).toEqual(8)

  arr = []
  max = allMaxBy(
    arr,
    (a, b) => a-b
  )
  expect(max).toEqual(expect.arrayContaining([]))
  expect(max.length).toEqual(0)

  arr = [5]
  max = allMaxBy(
    arr,
    (a, b) => a-b
  )
  expect(max).toEqual(expect.arrayContaining([5]))
  expect(max.length).toEqual(1)

});

it("maxBy works", () => {

  let arr = [0, 1, 2, 3, 5, 5, 5, 5, 5, 5, 5, 2, 3, 5, 4, 3, -1]
  let max = maxBy(
    arr,
    (a, b) => a-b
  )
  expect(max).toEqual(5)

  arr = []
  max = maxBy(
    arr,
    (a, b) => a-b
  )
  expect(max).toEqual(undefined)

  arr = [5]
  max = maxBy(
    arr,
    (a, b) => a-b
  )
  expect(max).toEqual(5)

});

class M {
  constructor(readonly a: number, readonly b: number) {}
  toString() {
    return `${this.a}`
  }
}
class N extends M {
  constructor(readonly c: number, readonly d: number) {
    super(100, 200)
  }
  to100() {
    return this.a * 100
  }
}
it ('clone works', () => {
  const n1 = new N(3, 4)
  expect(n1.a).toStrictEqual(100)
  expect(n1.c).toStrictEqual(3)

  const n2 = clone(n1, { c: 3000, a: 5 })
  expect(n1.c).toStrictEqual(3)
  expect(n2.c).toStrictEqual(3000)
  expect(n2.toString()).toStrictEqual('5')
  expect(n2.to100()).toStrictEqual(500)
  expect(n1.to100()).toStrictEqual(10000)
})
