import {asyncScheduler, BehaviorSubject, Observable, of, SchedulerLike, Subject, zip} from "rxjs"
import {map, scan, startWith, switchMap} from "rxjs/operators"
import {enqueue, extend, Millisec} from "../util_rx"

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
  valueTo:                IAnimationValueF<X>
  t:                      Millisec

  // ---- Should be a monad 😅
  map(f: (x: X) => X): IAnimation<X>
}
export class BaseAnimation<X> implements IAnimation<X> {
  // eslint-disable-next-line no-useless-constructor
  constructor(readonly valueTo: IAnimationValueF<X>, readonly t: Millisec = 0) {}

  // ---- Convenience
  static NULL: BaseAnimation<any> = new BaseAnimation((x: any) => x, 0)

  // ---- IAnimation interface
  map(mapper: (x: X) => X) {
    return new BaseAnimation<X>((x: X) => mapper(this.valueTo(x)), this.t)
  }
  multi(other: IAnimation<X>) {
    return new MultiAnimation(this, other)
  }
}
export class MultiAnimation<X> implements IAnimation<X> {

  // ---- IAnimation interface
  get valueTo(): IAnimationValueF<X> {
    return (x0: X) =>
      this.animations.reduce((x, a: IAnimation<X>) => a.valueTo(x), x0)
  }
  get t() { return this.animations.reduce((t, a) => t + a.t, 0) }
  map(mapper: (x: X) => X) {
    return new MultiAnimation<X>(
      ...this.animations.map(a => a.map(mapper))
    )
  }

  animations: Array<IAnimation<X>>
  constructor(...animations: Array<IAnimation<X>>) {
    this.animations = animations
  }
}


// ---- This enqueues-out MultiAnimations based on their duration
function enqueueMulti<X>(animation: IAnimation<X>, scheduler: SchedulerLike): Observable<IAnimation<X>> {
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
function rollAnimations<X>(x0: X, animation$: Observable<IAnimation<X>>)
  : Observable<[X, IAnimation<X>]> {
  const x$ = animation$.pipe(
    scan((xPrev, animation) => animation.valueTo(xPrev), x0),
    startWith<X>(x0),
  )
  return zip(x$, animation$)
}

export class Animatorer<X> {

  // ---- Input Animations
  animation$  = new Subject<IAnimation<X>>()

  // ---- Lifecycle
  constructor(readonly xInitial: X, readonly scheduler: SchedulerLike = asyncScheduler) {
  }

  // ---- Output Animation
  private _output$: BehaviorSubject<[X, IAnimation<X>]>|null = null

  /**
   * @deprecated
   */
  get output$() {
    if (!this._output$) {
      this._output$ = new BehaviorSubject([this.xInitial, BaseAnimation.NULL as IAnimation<X>])
      rollAnimations(this.xInitial, this.animation$).pipe(
        // Sub-animations if MultiAnimation
        switchMap(
          ([xBase, animation]) => rollAnimations(xBase, enqueueMulti(animation, this.scheduler))
        )
      ).subscribe(this._output$)
    }
    return this._output$
  }

  /**
   *
   */
  private _value$: BehaviorSubject<X>|null = null

  get value$() {
    if (!this._value$) {
      this._value$ = new BehaviorSubject(this.xInitial)
      this.output$.pipe(
        map(([x, animation]) => animation.valueTo(x))
      ).subscribe(this._value$)
    }
    return this._value$

  }
}

// export function useAnimatorer<T>(animatorer: Animatorer<T>):
//   ([ T, IAnimation<T>])
// {
//
// }
