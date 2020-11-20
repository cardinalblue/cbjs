import {BehaviorSubject, Observable, Subject} from "rxjs"
import {switchMap, takeUntil, tap} from "rxjs/operators"

export class Domainer {
  shutdown$ = new Subject<any>()

  static debug: boolean = false

  observing<T>(source: Observable<T>) {
    source.pipe(
      takeUntil(this.shutdown$),
    ).subscribe()
  }

  triggering<T, M>(trigger$: Observable<T>,
                     manipulator: (t: T) => Observable<M>,
                     monad = switchMap) {
    return trigger$.pipe(
      takeUntil(this.shutdown$),
      tap(t => Domainer.debug && console.debug("---- triggering", t)),
      monad(manipulator)
    ).subscribe()
  }

  connecting<T>(source: Observable<T>, destination: Subject<T>) {
    return source.pipe(
      takeUntil(this.shutdown$),
      tap(t => Domainer.debug && console.debug("---- connecting", t)),
      tap((t: T) => destination.next(t))
    ).subscribe()
  }

  updating<T>(source: Observable<T>,
              destination: BehaviorSubject<T>,
              isEqual: (a: T, b: T) => boolean = (a,b) => a === b) {
    return source.pipe(
      takeUntil(this.shutdown$),
      tap((t: T) => {
        if (!isEqual(destination.value, t)) {
          tap(t => Domainer.debug && console.debug("---- updating", t)),
          destination.next(t)
        }
      })
    ).subscribe()
  }

}
