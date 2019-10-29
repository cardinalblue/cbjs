import * as _ from "lodash"
import {Elementable} from "./util"
import {TestScheduler} from 'rxjs/testing'

beforeEach(function() {
  jest.addMatchers({
    toBeEnumerableCloseTo: function() {
      return {
        compare: function(actual: any, expected: any, precision: number = 0.0001)
          : jest.CustomMatcherResult {
          for (const [index, e] of expected.entries()) {
            const a = actual[index]
            if ((typeof a == 'undefined') || Math.abs(a - e) > precision) {
              return {
                pass: false,
                message: () => `Expected [${index}] to be close to ${e} but got ${a}. Actual=${actual}`
              }
            }
          }
          return { pass: true, message: () => "Ok!" }
        }
      }
    }
  })
})

// =======================================================================

export function expectElem<T>(x: Elementable<T>) {
  return expect(_.flattenDeep(x.elements))
}

// =======================================================================

export function testScheduler() {
  return new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected)
  })
}


