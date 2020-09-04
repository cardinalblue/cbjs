import {asyncScheduler, BehaviorSubject, Observable, of, SchedulerLike, Subject, zip} from "rxjs"
import {map, scan, startWith, switchMap} from "rxjs/operators"
import {enqueue, extend, Millisec} from "./util_rx"

// =================================================================
// Animatorer:
//
// An Animation consists of:
// 1. A function that given the initial value, returns what the
//    next value at the end of that animation should be.
// 2. A length of time that the animation should last.
//
// For example:
// - { valueTo: x => 3, t: 10s ] will move the value to 3 in 10 secs,
//   regardless of the initial value.
// - { valueTo: x => x+1, t: 20s ] will increment the value by 1 in 20 secs.
//
// MultiAnimations sequentially chain the animations.
//
// The Animatorer below receives in its `animation$` input a sequence
// of Animations. It outputs a pair of [ current value, animation with time ] to be
// animated.
//
// Currently incoming new `animation$` inputs "compress" the previous animations,
// meaning the value is still updated by the previous animations but effect
// their value immediately.
// =================================================================

type IAnimationValueF<X> = (x: X) => X
export interface IAnimation<X> {
  valueTo:    IAnimationValueF<X>
  t:          Millisec
}
export class BaseAnimation<X> implements IAnimation<X> {
  // eslint-disable-next-line no-useless-constructor
  constructor(readonly valueTo: IAnimationValueF<X>, readonly t: Millisec = 0) {}
  static NULL: BaseAnimation<any> = new BaseAnimation((x: any) => x, 0)

  multi(other: IAnimation<X>) {
    return new MultiAnimation(this, other)
  }
}
export class MultiAnimation<X> implements IAnimation<X> {
  get valueTo(): IAnimationValueF<X> {
    return (x0: X) =>
      this.animations.reduce((x, a: IAnimation<X>) => a.valueTo(x), x0)
  }
  get t() { return this.animations.reduce((t, a) => t + a.t, 0) }

  animations: Array<IAnimation<X>>
  constructor(...animations: Array<IAnimation<X>>) {
    this.animations = animations
  }
}


export class Animatorer<X> {

  // ---- Input Animations
  animation$  = new Subject<IAnimation<X>>()

  // ---- Output Animation
  output$:    BehaviorSubject<[X, IAnimation<X>]>
  value$:     BehaviorSubject<X>

  // ---- Lifecycle
  constructor(xInitial: X, readonly scheduler: SchedulerLike = asyncScheduler) {

    this.output$   = new BehaviorSubject([xInitial, BaseAnimation.NULL])
    this.value$    = new BehaviorSubject(xInitial)

    // ---- This enqueues-out MultiAnimations based on their duration
    function enqueueMulti(animation: IAnimation<X>): Observable<IAnimation<X>> {
      return (animation instanceof MultiAnimation) ?
        // If multi, break it out enqueued (i.e. spaced out by duration)
        of(...animation.animations).pipe(
          enqueue(a => a.t, scheduler))
        // Otherwise just send out individually
        : of(animation).pipe(
          extend(animation.t, scheduler))
    }

    // ----- Calculates the sequence of initial values for the animations,
    //       and emits pairs [ initial value, animation ].
    //
    function rollAnimations<X>(x0: X, animations: Observable<IAnimation<X>>)
      : Observable<[X, IAnimation<X>]> {
      const x$ = animations.pipe(
        scan((xPrev, animation) => animation.valueTo(xPrev), x0),
        startWith<X,X>(x0),
      )
      return zip(x$, animations)    }

    // ----- Produce output$
    rollAnimations(xInitial, this.animation$).pipe(
      // Sub-animations if MultiAnimation
      switchMap(
        ([xBase, animation]) => rollAnimations(xBase, enqueueMulti(animation))
      )
    ).subscribe(this.output$)

    // ---- Produce value$
    this.output$.pipe(
      map(([x, animation]) => animation.valueTo(x))
    ).subscribe(this.value$)
  }



}
