import './setup_test'
import {Animatorer, BaseAnimation, MultiAnimation} from "../animatorer"
import {testScheduler} from "./setup_test"

it('animatorer works singles', () => {
  const scheduler = testScheduler()
  scheduler.run( helpers => {
    const {cold, expectObservable: ex} = helpers
    const animatorer = new Animatorer(5, scheduler)
    const a = new BaseAnimation((x: number) => x + 10, 1)
    const b = new BaseAnimation((x: number) => x + 30, 3)
    const c = new BaseAnimation((x: number) => x + 70, 7)
    const animations = { a, b, c }
    cold("---a---b-c----", animations).subscribe(animatorer.animation$)
    ex(animatorer.output$).toBe("x--a---b-c----", {
      x: [5, BaseAnimation.NULL],
      a: [5,  a],
      b: [15, b],
      c: [45, c],
    })
  })
})
it('animatorer works multi', () => {
  const scheduler = testScheduler()
  scheduler.run( helpers => {
    const {cold, expectObservable: ex} = helpers
    let animatorer

    const i = new BaseAnimation((x: number) => x + 2,  1)
    const j = new BaseAnimation((x: number) => x + 5,  3)
    const k = new BaseAnimation((x: number) => x + 11, 4)

    const a = new BaseAnimation((x: number) => x + 10, 1)
    const m = new MultiAnimation(i, j, k)
    const c = new BaseAnimation((x: number) => x + 70, 7)

    const animations = { a, m, c, i, j, k }

    // Let the Multi play out
    animatorer = new Animatorer(5, scheduler)
    cold(   "---a---m----------c----", animations).subscribe(animatorer.animation$)
    ex(animatorer.output$)
      .toBe("x--a---ij--k------c----", {
      x: [5, BaseAnimation.NULL],
      a: [5,  a],
      i: [15, i],
      j: [17, j],
      k: [22, k],
      c: [33, c],
    })

    // Cut the Multi short
    animatorer = new Animatorer(5, scheduler)
    cold(   "---a---m--c----", animations).subscribe(animatorer.animation$)
    ex(animatorer.output$)
      .toBe("x--a---ij-c----", {
      x: [5, BaseAnimation.NULL],
      a: [5,  a],
      i: [15, i],
      j: [17, j],
      // k: [22, k], // Gets cut off
      c: [33, c],
    })
  })
})
