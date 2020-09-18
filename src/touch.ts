import {Observable} from 'rxjs'
import {Point, Rect} from './kor'
import {Millisec} from "./util_rx"
import {now} from "./util"
import * as _ from "lodash"
import {safeKey} from "./util_math";

export type TTouchTargeting<TT=any> = {
  target: TT,
  rect:   Rect,
}

export class TTouch<TT=any> {

  // eslint-disable-next-line no-useless-constructor
  constructor(readonly identifier: number,
              readonly point: Point,
              readonly pointElement?: Point,
              readonly button?: number,
              readonly targetings: TTouchTargeting<TT>[] = [])
  {
  }
}

export class TTouchEvent<PlatformEvent=any, TT=any> {
  // eslint-disable-next-line no-useless-constructor
  constructor(readonly touches: TTouch<TT>[],
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
  get targetings(): TTouchTargeting<TT>[] {
    return _.uniq(_.flatMap(this.touches, touch => touch.targetings))
  }
}

export type TTouchGesture = Observable<TTouchEvent>

