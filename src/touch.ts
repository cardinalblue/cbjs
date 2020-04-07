import {Observable} from 'rxjs'
import {Point} from './kor'
import {Millisec, now} from "cbjs"
import * as _ from "lodash"
import {safeKey} from "./util_math";

export interface TTouchTarget {}

export class TTouch {
  // eslint-disable-next-line no-useless-constructor
  constructor(readonly identifier: number,
              readonly point: Point,
              readonly button: number|undefined = undefined,
              readonly targets: TTouchTarget[] = [],
              )
  {
  }
}

export class TTouchEvent<PlatformEvent=any> {
  // eslint-disable-next-line no-useless-constructor
  constructor(readonly touches: TTouch[],
              readonly t: Millisec = now(),
              readonly platform: PlatformEvent|null = null,
              ) {
  }

  get shiftKey() { return safeKey(this.platform, 'shiftKey') as boolean }
  get altKey()   { return safeKey(this.platform, 'altKey')   as boolean }
  get metaKey()  { return safeKey(this.platform, 'metaKey')  as boolean }
  get ctrlKey()  { return safeKey(this.platform, 'ctrlKey')  as boolean }

  // ---- Overridable interfaces (View/platform code should override).
  //      Platform independent override that prevents the platform dependent
  //      behavior associated with a gesture.
  //
  static commit: ((e: TTouchEvent|null) => any) =
    (_) => {
      console.log("++++ TTouchEvent commit")
    }

    // Convenient function
  get targets(): TTouchTarget[] {
    return _.uniq(_.flatMap(this.touches, touch => touch.targets))
  }
}

export type TTouchGesture = Observable<TTouchEvent>

