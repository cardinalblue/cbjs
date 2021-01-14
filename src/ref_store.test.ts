import './tests/setup_test'
import {RefStore} from "./ref_store"

it('RefStore works', () => {
  const s = new RefStore()
  s.insert(1, { current: 'a' })
  expect(s.stored).toEqual([
    { ref: { current: 'a' }, key: 1 }
    ])
  s.insert(2, { current: 'b' })
  expect(s.stored).toEqual([
    { ref: { current: 'a' }, key: 1 },
    { ref: { current: 'b' }, key: 2 },
  ])
  s.insert(2, { current: 'c' })
  expect(s.stored).toEqual([
    { ref: { current: 'a' }, key: 1 },
    { ref: { current: 'c' }, key: 2 },
  ])
  s.remove(2)
  expect(s.stored).toEqual([
    { ref: { current: 'a' }, key: 1 },
  ])
})
