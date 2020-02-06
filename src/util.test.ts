import {
  mapmap, arrayRemove, insertAt, typeCheck
} from "./util"
import {Contexter} from "./contexter"

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

