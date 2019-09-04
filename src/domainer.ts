import {Observable, Subject} from "rxjs"
import {switchMap, takeUntil, tap} from "rxjs/operators"

export class Domainer {
  shutdown$ = new Subject<any>()

  triggering<T, M>(trigger$: Observable<T>,
                     manipulator: (t: T) => Observable<M>,
                     monad = switchMap) {
    return trigger$.pipe(
      takeUntil(this.shutdown$),
      monad(manipulator)
    ).subscribe()
  }

  connecting<T>(source: Observable<T>, destination: Subject<T>) {
    return source.pipe(
      takeUntil(this.shutdown$),
      tap((t: T) => destination.next(t))
    ).subscribe()
  }
}