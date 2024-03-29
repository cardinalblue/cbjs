import {BehaviorSubject, EMPTY, Observable, Subject} from "rxjs"
import {catchError, first, switchMap, takeUntil, tap} from "rxjs/operators"
import {log$, taplog} from "./util_rx"

export class Domainer {
  shutdown$ = new Subject<any>()

  constructor(public _debug=false) {

    if (_debug)
      this.shutdown$.subscribe(_ => {
        console.debug("---- Domainer shutdown$")
      })

    // ---- Debug statement for shutdown$ (can't use connecting/observing)
    this.shutdown$.pipe(
      first(),
      taplog("**** shutdown$", this),
      ).subscribe()
  }

  observing<T>(source: Observable<T>) {
    source.pipe(
      takeUntil(this.shutdown$),
    ).subscribe()
  }

  activating<T>(activator$: Observable<T>, action: (t: T) => any) {
    return activator$.pipe(
      takeUntil(this.shutdown$),
      tap(action),
    ).subscribe()
  }

  triggering<T, M>(trigger$: Observable<T>,
                     manipulator: (t: T) => Observable<M>,
                     monad = switchMap) {
    return trigger$.pipe(
      takeUntil(this.shutdown$),
      tap(t => this._debug && console.debug("---- triggering", t)),
      monad(t => manipulator(t).pipe(
        catchError(e => {
          console.error("++++ triggering error", e)
          return EMPTY
        })
      ))
    ).subscribe()
  }

  connecting<T>(source: Observable<T>, destination: Subject<T>) {
    return source.pipe(
      takeUntil(this.shutdown$),
      tap(t => this._debug && console.debug("---- connecting", t)),
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
          this._debug && console.debug("---- updating", t)
          destination.next(t)
        }
      })
    ).subscribe()
  }

  logging<T>(source: Observable<T>, s: string) {
    source.pipe(
      takeUntil(this.shutdown$),
      log$(s),
    ).subscribe()
  }

}
